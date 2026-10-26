import type { QueryClient } from '@tanstack/react-query';
import { parseGpx, type ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
import { buildRouteGeometry } from '@pacevault/gpx/routeGeometry.ts';
import { saveStudioRoutePoints, deleteStudioRoutePoints } from '@/lib/db.ts';
import { encodedSegmentPolylines } from '@/lib/gpsTrack.ts';
import { useStudioStore } from '@/store/studio.ts';
import { invalidateStudioRoutePoints } from '@/queries/studio/useStudioRoutePoints.ts';
import { nextRouteColor } from './routeColors.ts';

/**
 * Turn route points into a persisted studio route (store entry + point blob) and
 * return its id, or `null` if the points don't make a usable route.
 */
export const createStudioRouteFromPoints = async (
  {
    points,
    name,
    sourceFileName,
  }: {
    points: ParsedGpxPoint[];
    name: string;
    sourceFileName: string;
  },
  queryClient: QueryClient,
): Promise<string | null> => {
  const geometry = buildRouteGeometry(points);
  if (!geometry) return null;

  const usedColors = useStudioStore.getState().routes.map((r) => r.color);
  const id = useStudioStore.getState().importStudioRoute({
    name,
    sourceFileName,
    color: nextRouteColor(usedColors),
    encodedPolylines: encodedSegmentPolylines(geometry.points),
    bounds: geometry.bounds,
    distance: geometry.distanceMeters,
    elevation: geometry.elevation,
  });

  try {
    await saveStudioRoutePoints({ routeId: id, points: geometry.points });
  } catch {
    useStudioStore.getState().deleteStudioRoute(id);
    await deleteStudioRoutePoints(id).catch(() => undefined);
    return null;
  }
  await invalidateStudioRoutePoints({ routeId: id }, queryClient);
  return id;
};

/**
 * Turn GPX text into a persisted studio route and return its id, or `null` if the
 * text can't be parsed into a usable route.
 * Shared by file import and "edit session in studio" so both stay in lockstep.
 * The embedded `<name>` wins; `fallbackName` is used when the GPX has none.
 */
export const createStudioRouteFromGpx = async (
  {
    text,
    fallbackName,
    sourceFileName,
  }: {
    text: string;
    fallbackName: string;
    sourceFileName: string;
  },
  queryClient: QueryClient,
): Promise<string | null> => {
  const parsed = parseGpx(text);
  if (!parsed) return null;
  return createStudioRouteFromPoints(
    { points: parsed.points, name: parsed.name ?? fallbackName, sourceFileName },
    queryClient,
  );
};
