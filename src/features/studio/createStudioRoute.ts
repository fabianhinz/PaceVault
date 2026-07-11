import { parseGpx } from '@/packages/gpx/parseGpx.ts';
import { buildRouteGeometry } from '@/packages/gpx/routeGeometry.ts';
import { saveStudioRoutePoints, deleteStudioRoutePoints } from '@/lib/indexeddb.ts';
import { useStudioStore } from '@/store/studio.ts';
import { DEFAULT_ROUTE_COLOR } from './routeColors.ts';

/**
 * Turn GPX text into a persisted studio route (store entry + point blob) and
 * return its id, or `null` if the text can't be parsed into a usable route.
 * Shared by file import and "edit session in studio" so both stay in lockstep.
 * The embedded `<name>` wins; `fallbackName` is used when the GPX has none.
 */
export const createStudioRouteFromGpx = async (
  text: string,
  meta: { fallbackName: string; sourceFileName: string },
): Promise<string | null> => {
  const parsed = parseGpx(text);
  if (!parsed) return null;

  const geometry = buildRouteGeometry(parsed.points);
  if (!geometry) return null;

  const id = useStudioStore.getState().importStudioRoute({
    name: parsed.name ?? meta.fallbackName,
    sourceFileName: meta.sourceFileName,
    color: DEFAULT_ROUTE_COLOR,
    encodedPolylines: geometry.encodedPolylines,
    bounds: geometry.bounds,
    distance: geometry.distance,
    elevation: geometry.elevation,
  });

  try {
    await saveStudioRoutePoints(id, geometry.points);
  } catch {
    useStudioStore.getState().deleteStudioRoute(id);
    await deleteStudioRoutePoints(id).catch(() => undefined);
    return null;
  }
  return id;
};
