import { buildGpxString } from '@/packages/gpx/buildGpx.ts';
import { sliceRoute } from '@/packages/gpx/routeCut.ts';
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

  return buildGpxString(points, {
    name: session.name,
    time: new Date(session.date),
  });
};

const toGpxPoint = (p: RoutePoint): GpxPoint => {
  const point: GpxPoint = { lat: p.lat, lon: p.lng, ele: p.ele };
  if (p.time != null) point.time = new Date(p.time);
  return point;
};

export const buildRouteSegmentGpx = (
  points: RoutePoint[],
  startM: number,
  endM: number,
  metadata: { name: string; time: Date },
): string | null => buildGpxString(sliceRoute(points, startM, endM).map(toGpxPoint), metadata);
