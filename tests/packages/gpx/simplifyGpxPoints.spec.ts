import { describe, it, expect } from 'vite-plus/test';
import { simplifyGpxPoints } from '@/packages/gpx/simplifyGpxPoints.ts';
import type { GpxPoint } from '@/packages/gpx/buildGpx.ts';

describe('simplifyGpxPoints', () => {
  it('returns input unchanged when fewer than 3 points', () => {
    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575 },
      { lat: 48.138, lon: 11.576 },
    ];

    expect(simplifyGpxPoints(points)).toEqual(points);
  });

  it('preserves first and last points', () => {
    const points: GpxPoint[] = Array.from({ length: 20 }, (_, i) => ({
      lat: 48.137 + i * 0.0001,
      lon: 11.575 + i * 0.0001,
    }));
    const result = simplifyGpxPoints(points);

    expect(result[0]).toBe(points[0]);
    expect(result[result.length - 1]).toBe(points[points.length - 1]);
  });

  it('removes collinear points', () => {
    const points: GpxPoint[] = Array.from({ length: 100 }, (_, i) => ({
      lat: 48.137 + i * 0.0001,
      lon: 11.575 + i * 0.0001,
    }));
    const result = simplifyGpxPoints(points);

    expect(result.length).toBeLessThan(points.length);
  });

  it('preserves ele and time on surviving points', () => {
    const time1 = new Date('2024-01-15T08:00:00Z');
    const time2 = new Date('2024-01-15T08:00:05Z');
    const time3 = new Date('2024-01-15T08:00:10Z');

    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575, ele: 520, time: time1 },
      { lat: 48.137, lon: 11.575, ele: 521, time: time2 },
      { lat: 48.14, lon: 11.58, ele: 530, time: time3 },
    ];
    const result = simplifyGpxPoints(points);

    for (const p of result) {
      expect(p.ele).toBeDefined();
      expect(p.time).toBeInstanceOf(Date);
    }
  });

  it('keeps points at sharp turns', () => {
    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575 },
      { lat: 48.138, lon: 11.575 },
      { lat: 48.139, lon: 11.575 },
      { lat: 48.139, lon: 11.576 },
      { lat: 48.139, lon: 11.577 },
    ];
    const result = simplifyGpxPoints(points);

    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result).toContainEqual(points[2]);
  });
});
