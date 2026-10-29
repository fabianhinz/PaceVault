import { buildGpxString } from '@pacevault/gpx/buildGpx.ts';
import { pointAtRouteDistance, sliceRoute } from '@pacevault/gpx/routeCut.ts';
import { isValidCoordinate } from '@pacevault/engine/geodesy.ts';
import type { TrainingSession, SessionRecord } from '@pacevault/engine/types.ts';
import type { GpxPoint, GpxWaypoint } from '@pacevault/gpx/buildGpx.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { StudioMarker } from '@/types.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

interface RouteGpxMetadata {
  name: string;
  time: Date;
}

export const buildSessionGpx = ({
  session,
  records,
}: {
  session: TrainingSession;
  records: SessionRecord[];
}): string | null => {
  const points = records.reduce<GpxPoint[]>((acc, r) => {
    if (isValidCoordinate(r)) {
      acc.push({
        lat: r.lat,
        lon: r.lng,
        ele: r.elevation,
        time: new Date(session.date + r.timestamp * MS_PER_SECOND),
      });
    }
    return acc;
  }, []);

  return buildGpxString({
    points,
    metadata: {
      name: session.name,
      time: new Date(session.date),
    },
  });
};

const toGpxPoint = (p: RoutePoint): GpxPoint => {
  const point: GpxPoint = { lat: p.lat, lon: p.lng, ele: p.ele, seg: p.seg };
  if (p.time != null) point.time = new Date(p.time);
  return point;
};

const poiWaypoints = ({
  points,
  markers,
  startM,
  endM,
}: {
  points: RoutePoint[];
  markers: StudioMarker[];
  startM: number;
  endM: number;
}): GpxWaypoint[] =>
  markers.reduce<GpxWaypoint[]>((acc, marker) => {
    if (marker.type !== 'point_of_interest') return acc;
    if (marker.distanceM < startM || marker.distanceM > endM) return acc;
    const at = pointAtRouteDistance({ points, distanceMeters: marker.distanceM });
    if (!at) return acc;
    const waypoint: GpxWaypoint = { lat: at.lat, lon: at.lng, ele: at.ele, name: marker.label };
    if (marker.description) waypoint.desc = marker.description;
    acc.push(waypoint);
    return acc;
  }, []);

export const buildRouteGpx = ({
  points,
  markers,
  metadata,
}: {
  points: RoutePoint[];
  markers: StudioMarker[];
  metadata: RouteGpxMetadata;
}): string | null =>
  buildGpxString({
    points: points.map(toGpxPoint),
    metadata,
    waypoints: poiWaypoints({ points, markers, startM: -Infinity, endM: Infinity }),
  });

export const buildRouteSegmentGpx = ({
  points,
  markers,
  startM,
  endM,
  metadata,
}: {
  points: RoutePoint[];
  markers: StudioMarker[];
  startM: number;
  endM: number;
  metadata: RouteGpxMetadata;
}): string | null =>
  buildGpxString({
    points: sliceRoute({ points, startMeters: startM, endMeters: endM }).map(toGpxPoint),
    metadata,
    waypoints: poiWaypoints({ points, markers, startM, endM }),
  });

export const buildGpxFilename = ({ sport, dateMs }: { sport: string; dateMs: number }): string => {
  const date = new Date(dateMs).toISOString().slice(0, 10);
  const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);
  return `PaceVault_${sportLabel}_${date}.gpx`;
};
