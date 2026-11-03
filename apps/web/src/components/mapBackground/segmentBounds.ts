import type { GPSBounds } from '@pacevault/engine/types.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';

export const segmentBounds = (segment: Pick<Segment, 'geometry'>): GPSBounds | null => {
  let bounds: GPSBounds | null = null;
  for (const point of segment.geometry) {
    if (bounds === null) {
      bounds = { minLat: point[0], maxLat: point[0], minLng: point[1], maxLng: point[1] };
      continue;
    }
    bounds.minLat = Math.min(bounds.minLat, point[0]);
    bounds.maxLat = Math.max(bounds.maxLat, point[0]);
    bounds.minLng = Math.min(bounds.minLng, point[1]);
    bounds.maxLng = Math.max(bounds.maxLng, point[1]);
  }
  return bounds;
};
