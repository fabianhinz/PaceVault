import { buildGpxString } from '@pacevault/gpx/buildGpx.ts';
import { pointAtRouteDistance, sliceRoute } from '@pacevault/gpx/routeCut.ts';
import { isValidCoordinate } from '@pacevault/engine/gps.ts';
import type { TrainingSession, SessionRecord } from '@pacevault/engine/types.ts';
import type { GpxPoint, GpxWaypoint } from '@pacevault/gpx/buildGpx.ts';
import type { RoutePoint } from '@pacevault/gpx/routeGeometry.ts';
import type { StudioMarker } from '@/store/studio.ts';

interface RouteGpxMetadata {
  name: string;
  time: Date;
}

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
  const point: GpxPoint = { lat: p.lat, lon: p.lng, ele: p.ele, seg: p.seg };
  if (p.time != null) point.time = new Date(p.time);
  return point;
};

const poiWaypoints = (
  points: RoutePoint[],
  markers: StudioMarker[],
  startM: number,
  endM: number,
): GpxWaypoint[] =>
  markers.reduce<GpxWaypoint[]>((acc, marker) => {
    if (marker.type !== 'point_of_interest') return acc;
    if (marker.distanceM < startM || marker.distanceM > endM) return acc;
    const at = pointAtRouteDistance(points, marker.distanceM);
    if (!at) return acc;
    const waypoint: GpxWaypoint = { lat: at.lat, lon: at.lng, ele: at.ele, name: marker.label };
    if (marker.description) waypoint.desc = marker.description;
    acc.push(waypoint);
    return acc;
  }, []);

export const buildRouteGpx = (
  points: RoutePoint[],
  markers: StudioMarker[],
  metadata: RouteGpxMetadata,
): string | null =>
  buildGpxString(
    points.map(toGpxPoint),
    metadata,
    poiWaypoints(points, markers, -Infinity, Infinity),
  );

export const buildRouteSegmentGpx = (
  points: RoutePoint[],
  markers: StudioMarker[],
  startM: number,
  endM: number,
  metadata: RouteGpxMetadata,
): string | null =>
  buildGpxString(
    sliceRoute(points, startM, endM).map(toGpxPoint),
    metadata,
    poiWaypoints(points, markers, startM, endM),
  );
