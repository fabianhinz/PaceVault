import { describe, expect, it } from 'vite-plus/test';
import { segmentBounds } from '@/components/mapBackground/segmentBounds.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

const LONG_GEOMETRY_POINTS = 500_000;

describe(segmentBounds.name, () => {
  it('bounds a very long geometry without overflowing the call stack', () => {
    const segment = createMockSegment({
      geometry: Array.from({ length: LONG_GEOMETRY_POINTS }, (_, i): [number, number] => [
        48 + i * 0.000001,
        11,
      ]),
    });

    expect(segmentBounds(segment)).toEqual({
      minLat: 48,
      maxLat: 48.499999,
      minLng: 11,
      maxLng: 11,
    });
  });
});
