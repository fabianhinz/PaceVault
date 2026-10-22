import { boundsOverlap, segmentIntersectsBounds } from '@pacevault/engine/gps.ts';
import type { GPSBounds } from '@pacevault/engine/types.ts';

interface GeoCorner {
  lat: number;
  lng: number;
}

export interface PickableTrack {
  sessionId: string;
  bounds: GPSBounds;
  path: [number, number][];
}

export const pickBoundsFromCorners = (a: GeoCorner, b: GeoCorner): GPSBounds => ({
  minLat: Math.min(a.lat, b.lat),
  maxLat: Math.max(a.lat, b.lat),
  minLng: Math.min(a.lng, b.lng),
  maxLng: Math.max(a.lng, b.lng),
});

export const filterTracksByPickBounds = (
  tracks: PickableTrack[],
  pickBounds: GPSBounds,
): string[] => {
  const seen = new Set<string>();
  for (const t of tracks) {
    if (seen.has(t.sessionId)) continue;
    if (!boundsOverlap(t.bounds, pickBounds)) continue;
    const hit = t.path.some((p, i) => {
      if (i === 0) return false;
      const prev = t.path[i - 1];
      if (!prev) return false;
      return segmentIntersectsBounds(prev, p, pickBounds);
    });
    if (hit) seen.add(t.sessionId);
  }
  return [...seen];
};
