import { parseGpx, type ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
import { buildRouteGeometry } from '@pacevault/gpx/routeGeometry.ts';
import { saveStudioRoutePoints, deleteStudioRoutePoints } from '@/lib/indexeddb.ts';
import { useStudioStore } from '@/store/studio.ts';
import { nextRouteColor } from './routeColors.ts';

/**
 * Turn route points into a persisted studio route (store entry + point blob) and
 * return its id, or `null` if the points don't make a usable route.
 */
export const createStudioRouteFromPoints = async (
  points: ParsedGpxPoint[],
  meta: { name: string; sourceFileName: string },
): Promise<string | null> => {
  const geometry = buildRouteGeometry(points);
  if (!geometry) return null;

  const usedColors = useStudioStore.getState().routes.map((r) => r.color);
  const id = useStudioStore.getState().importStudioRoute({
    name: meta.name,
    sourceFileName: meta.sourceFileName,
    color: nextRouteColor(usedColors),
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

/**
 * Turn GPX text into a persisted studio route and return its id, or `null` if the
 * text can't be parsed into a usable route.
 * Shared by file import and "edit session in studio" so both stay in lockstep.
 * The embedded `<name>` wins; `fallbackName` is used when the GPX has none.
 */
export const createStudioRouteFromGpx = async (
  text: string,
  meta: { fallbackName: string; sourceFileName: string },
): Promise<string | null> => {
  const parsed = parseGpx(text);
  if (!parsed) return null;
  return createStudioRouteFromPoints(parsed.points, {
    name: parsed.name ?? meta.fallbackName,
    sourceFileName: meta.sourceFileName,
  });
};
