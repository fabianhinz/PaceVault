import { describe, expect, it } from 'vite-plus/test';
import { encode } from '@googlemaps/polyline-codec';
import { reachesSegmentEnds } from '@/lib/analysis/segmentPrefilter.ts';
import { createMockSegmentReferencePoint } from '@pacevault/testing/segments.ts';

const reference = [
  createMockSegmentReferencePoint({ lat: 48.137, lng: 11.575, distanceMeters: 0 }),
  createMockSegmentReferencePoint({ lat: 48.146, lng: 11.575, distanceMeters: 1000 }),
];

describe(reachesSegmentEnds.name, () => {
  it('accepts a straight polyline whose vertices lie far beyond both ends', () => {
    const encodedPolyline = encode([
      [48.13, 11.575],
      [48.15, 11.575],
    ]);

    expect(reachesSegmentEnds({ encodedPolyline, reference })).toBe(true);
  });

  it('rejects a polyline that turns off before the segment end', () => {
    const encodedPolyline = encode([
      [48.13, 11.575],
      [48.14, 11.575],
      [48.14, 11.59],
    ]);

    expect(reachesSegmentEnds({ encodedPolyline, reference })).toBe(false);
  });

  it('rejects a parallel road outside the end tolerance', () => {
    const encodedPolyline = encode([
      [48.13, 11.577],
      [48.15, 11.577],
    ]);

    expect(reachesSegmentEnds({ encodedPolyline, reference })).toBe(false);
  });
});
