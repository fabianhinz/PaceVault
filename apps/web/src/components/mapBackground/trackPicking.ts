import { hasBoundsOverlap, isSegmentIntersectingBounds } from '@pacevault/engine/bounds.ts';
import type { GPSBounds, TrainingSession } from '@pacevault/engine/types.ts';
import type { PickingInfo } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import { decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';
import type { MapTrack } from './hooks/types.ts';

interface GeoCorner {
  lat: number;
  lng: number;
}

export interface PickableTrack {
  sessionId: string;
  bounds: GPSBounds;
  path: [number, number][];
}

export const PICK_RADIUS = 25;

const pathCache = new Map<string, [number, number][]>();

export const decodeCached = ({
  sessionId,
  encoded,
}: {
  sessionId: string;
  encoded: string;
}): [number, number][] => {
  let path = pathCache.get(sessionId);
  if (!path) {
    path = decodeTrackForRendering(encoded);
    pathCache.set(sessionId, path);
  }
  return path;
};

export const pickBoundsFromCorners = (a: GeoCorner, b: GeoCorner): GPSBounds => ({
  minLat: Math.min(a.lat, b.lat),
  maxLat: Math.max(a.lat, b.lat),
  minLng: Math.min(a.lng, b.lng),
  maxLng: Math.max(a.lng, b.lng),
});

export const filterTracksByPickBounds = ({
  tracks,
  pickBounds,
}: {
  tracks: PickableTrack[];
  pickBounds: GPSBounds;
}): string[] => {
  const seen = new Set<string>();
  for (const t of tracks) {
    if (seen.has(t.sessionId)) continue;
    if (!hasBoundsOverlap({ first: t.bounds, second: pickBounds })) continue;
    const hit = t.path.some((p, i) => {
      if (i === 0) return false;
      const prev = t.path[i - 1];
      if (!prev) return false;
      return isSegmentIntersectingBounds({ from: prev, to: p, bounds: pickBounds });
    });
    if (hit) seen.add(t.sessionId);
  }
  return [...seen];
};

export const pickSessionsAt = ({
  map,
  info,
  tracks,
}: {
  map: MapRef;
  info: Pick<PickingInfo, 'x' | 'y'>;
  tracks: MapTrack[];
}): TrainingSession[] => {
  const topLeft = map.unproject([info.x - PICK_RADIUS, info.y - PICK_RADIUS]);
  const bottomRight = map.unproject([info.x + PICK_RADIUS, info.y + PICK_RADIUS]);

  const pickBounds = pickBoundsFromCorners(topLeft, bottomRight);
  const pickable = tracks.map((t) => ({
    sessionId: t.sessionId,
    bounds: t.gps.bounds,
    path: decodeCached({ sessionId: t.sessionId, encoded: t.gps.encodedPolyline }),
  }));
  const hitIds = filterTracksByPickBounds({ tracks: pickable, pickBounds });

  if (hitIds.length === 0) {
    return [];
  }

  const hitSet = new Set(hitIds);
  return tracks.filter((t) => hitSet.has(t.sessionId)).map((t) => t.session);
};
