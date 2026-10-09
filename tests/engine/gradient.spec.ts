import { describe, expect, it } from 'vitest';
import { windowedGradients, type GradientPoint } from '@/packages/engine/gradient.ts';

const flat = (metres: number, elevation = 100): GradientPoint[] =>
  Array.from({ length: metres + 1 }, (_, d) => ({ distance: d, elevation }));

const largest = (gradients: Array<number | undefined>): number =>
  Math.max(...gradients.map((g) => Math.abs(g ?? 0)));

describe('windowedGradients', () => {
  it('measures over a centred 50 m window', () => {
    const points = flat(200);
    points[100] = { distance: 100, elevation: 105 };
    expect(largest(windowedGradients(points))).toBeCloseTo(5 / 50, 6);
  });

  it('reads a constant climb exactly', () => {
    const points = Array.from({ length: 201 }, (_, d) => ({ distance: d, elevation: d * 0.12 }));
    expect(windowedGradients(points)[100]).toBeCloseTo(0.12, 6);
  });

  it('never bridges missing elevation', () => {
    const points: GradientPoint[] = [
      ...flat(100),
      ...Array.from({ length: 10 }, (_, i) => ({ distance: 101 + i })),
      ...flat(100, 120).map((p) => ({ distance: (p.distance ?? 0) + 111, elevation: 120 })),
    ];
    const gradients = windowedGradients(points);
    expect(gradients.slice(101, 111).every((g) => g === undefined)).toBe(true);
    expect(largest(gradients)).toBe(0);
  });

  it('skips records without distance', () => {
    const after = flat(60)
      .slice(1)
      .map((p) => ({ ...p, distance: (p.distance ?? 0) + 60 }));
    const gradients = windowedGradients([...flat(60), { elevation: 500 }, ...after]);
    expect(gradients[61]).toBeUndefined();
    expect(largest(gradients)).toBe(0);
  });

  it('merges a stop into one point so its elevation drift does not tilt the road', () => {
    const stop = Array.from({ length: 30 }, (_, i) => ({
      distance: 100,
      elevation: 100 + (i === 29 ? 3 : 0),
    }));
    const points = [
      ...flat(99),
      ...stop,
      ...flat(100).map((p) => ({ ...p, distance: (p.distance ?? 0) + 101 })),
    ];
    expect(largest(windowedGradients(points))).toBeLessThan(0.01);
  });
});
