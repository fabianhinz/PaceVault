import { buildGpxString } from '@/packages/gpx/buildGpx.ts';
import { simplifyGpxPoints } from '@/packages/gpx/simplifyGpxPoints.ts';
import { isValidCoordinate } from '@/packages/engine/gps.ts';
import type { TrainingSession, SessionRecord } from '@/packages/engine/types.ts';
import type { GpxPoint } from '@/packages/gpx/buildGpx.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';

export const buildSessionGpx = (
  session: TrainingSession,
  records: SessionRecord[],
): string | null => {
  const points = records.reduce<GpxPoint[]>((acc, r) => {
    if (isValidCoordinate(r) && r.lat != null && r.lng != null) {
      acc.push({
        lat: r.lat,
        lon: r.lng,
        ele: r.elevation,
        time: new Date(session.date + r.timestamp * 1000),
      });
    }
    return acc;
  }, []);

  const simplified = simplifyGpxPoints(points);

  return buildGpxString(simplified, {
    name: session.name,
    time: new Date(session.date),
  });
};

/**
 * GPX for the slice of a route between two cumulative distances (metres from the
 * start) — used to export a segment cut by split points. Returns `null` when the
 * slice has fewer than two points.
 */
export const buildRouteSegmentGpx = (
  points: RoutePoint[],
  startM: number,
  endM: number,
  metadata: { name: string; time: Date },
): string | null => {
  const slice = points
    .filter((p) => p.dist >= startM && p.dist <= endM)
    .map<GpxPoint>((p) => ({ lat: p.lat, lon: p.lng, ele: p.ele }));

  return buildGpxString(slice, metadata);
};
