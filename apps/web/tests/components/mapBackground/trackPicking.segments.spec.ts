import { describe, expect, it } from 'vite-plus/test';
import { segmentsInPickBounds } from '@/components/mapBackground/trackPicking.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

const north = createMockSegment({
  id: 'north',
  geometry: [
    [48.0, 11.0],
    [48.01, 11.0],
  ],
});
const east = createMockSegment({
  id: 'east',
  geometry: [
    [48.005, 11.0],
    [48.005, 11.02],
  ],
});

describe(segmentsInPickBounds.name, () => {
  it('returns every segment crossing the pick area', () => {
    const pickBounds = { minLat: 48.004, maxLat: 48.006, minLng: 10.999, maxLng: 11.001 };

    expect(
      segmentsInPickBounds({ segments: [north, east], pickBounds }).map((segment) => segment.id),
    ).toEqual(['north', 'east']);
  });

  it('returns nothing when no band crosses the pick area', () => {
    const pickBounds = { minLat: 47, maxLat: 47.001, minLng: 10, maxLng: 10.001 };

    expect(segmentsInPickBounds({ segments: [north, east], pickBounds })).toEqual([]);
  });
});
