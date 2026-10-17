import { describe, it, expect } from 'vitest';
import { encode } from '@googlemaps/polyline-codec';
import { buildPreviewPasses, slicePath, type PreviewPass } from '@/features/map/previewDrawIn.ts';

// A straight 3-point line: two 100 m legs.
const pass: PreviewPass = {
  sport: 'running',
  path: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  cumulative: [0, 100, 200],
  length: 200,
  start: 1000,
  duration: 2000,
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

describe('slicePath', () => {
  it('is empty before the pass starts', () => {
    expect(slicePath(pass, 0)).toEqual([]);
    expect(slicePath(pass, 1000)).toEqual([]);
  });

  it('mid-pass gives the prefix plus an end point at the exact fraction of the length', () => {
    const elapsed = 1000 + 2000 * 0.4;
    const drawnM = easeOutCubic(0.4) * 200;
    const sliced = slicePath(pass, elapsed);
    expect(sliced).toHaveLength(3);
    expect(sliced.slice(0, 2)).toEqual([
      [0, 0],
      [1, 0],
    ]);
    expect(sliced[2]?.[0]).toBeCloseTo(1 + (drawnM - 100) / 100, 10);
    expect(sliced[2]?.[1]).toBe(0);
  });

  it('gives the full path at and after start + duration', () => {
    expect(slicePath(pass, 3000)).toBe(pass.path);
    expect(slicePath(pass, 10_000)).toBe(pass.path);
  });
});

describe('buildPreviewPasses', () => {
  const routes = [
    {
      sport: 'running' as const,
      polyline: encode(
        [
          [48.1, 11.5],
          [48.11, 11.51],
          [48.12, 11.5],
        ],
        5,
      ),
    },
    {
      sport: 'cycling' as const,
      polyline: encode(
        [
          [48.2, 11.6],
          [48.25, 11.7],
        ],
        5,
      ),
    },
  ];

  it('is deterministic for the same input', () => {
    expect(buildPreviewPasses(routes)).toEqual(buildPreviewPasses(routes));
  });
});
