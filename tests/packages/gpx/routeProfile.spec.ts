import { describe, it, expect } from 'vitest';
import { buildRouteProfile } from '@/packages/gpx/routeProfile.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';

const point = (dist: number, ele?: number): RoutePoint => ({
  lat: 47 + dist / 111_190,
  lng: 11,
  ele,
  seg: 0,
  dist,
});

/** Flat route with a single steep ramp of `rampGrade`% between rampFrom/rampTo (10 m spacing). */
const routeWithRamp = (
  totalM: number,
  rampFrom: number,
  rampTo: number,
  rampGrade: number,
): RoutePoint[] => {
  const points: RoutePoint[] = [];
  let ele = 100;
  for (let d = 0; d <= totalM; d += 10) {
    if (d > rampFrom && d <= rampTo) {
      ele += (rampGrade / 100) * 10;
    }
    points.push(point(d, ele));
  }
  return points;
};

describe('buildRouteProfile', () => {
  it('emits aligned elevation and grade series with identical dist keys', () => {
    const profile = buildRouteProfile(routeWithRamp(1000, 400, 600, 10));
    expect(profile.elevation.length).toBe(profile.grade.length);
    expect(profile.grade.map((p) => p.dist)).toEqual(profile.elevation.map((p) => p.dist));
  });

  it('maps points to km distance, rounded elevation and coordinates', () => {
    const profile = buildRouteProfile([point(0, 500.04), point(1500, 620.26)]);
    expect(profile.elevation[0]).toMatchObject({ dist: 0, elevation: 500, lng: 11 });
    expect(profile.elevation[1]).toMatchObject({ dist: 1.5, elevation: 620.3 });
  });

  it('skips points without elevation', () => {
    const profile = buildRouteProfile([point(0, 500), point(100), point(200, 510)]);
    expect(profile.elevation.map((p) => p.dist)).toEqual([0, 0.2]);
  });

  it('returns empty series when no point has elevation', () => {
    const profile = buildRouteProfile([point(0), point(100)]);
    expect(profile.elevation).toEqual([]);
    expect(profile.grade).toEqual([]);
  });

  it('computes grade over a centered window on a constant climb', () => {
    // 10% climb throughout — every point inside the route reads 10%.
    const points = Array.from({ length: 51 }, (_, i) => point(i * 10, 100 + i));
    const profile = buildRouteProfile(points);
    const middle = profile.grade[25];
    expect(middle?.grade).toBe(10);
  });

  it('reports negative grade on descents', () => {
    const points = Array.from({ length: 51 }, (_, i) => point(i * 10, 500 - i * 0.5));
    const profile = buildRouteProfile(points);
    expect(profile.grade[25]?.grade).toBe(-5);
  });

  it('preserves the full steepness of a sustained ramp', () => {
    // 200 m at 14% inside a flat 2 km route.
    const profile = buildRouteProfile(routeWithRamp(2000, 1000, 1200, 14));
    const maxGrade = Math.max(...profile.grade.map((p) => p.grade));
    expect(maxGrade).toBeCloseTo(14, 0);
  });

  it('keeps a short steep kicker visible after decimation of a huge route', () => {
    // 100 km at 10 m spacing (10k points, well above the display cap) with one
    // 200 m kicker at 14% — uniform every-nth sampling would flatten it.
    const profile = buildRouteProfile(routeWithRamp(100_000, 50_000, 50_200, 14));
    expect(profile.grade.length).toBeLessThanOrEqual(1000);
    const maxGrade = Math.max(...profile.grade.map((p) => p.grade));
    expect(maxGrade).toBeCloseTo(14, 0);
  });

  it('caps huge inputs while keeping the first and last points', () => {
    const points = Array.from({ length: 5000 }, (_, i) => point(i * 10, 100 + i));
    const profile = buildRouteProfile(points);
    expect(profile.elevation.length).toBeLessThanOrEqual(1000);
    expect(profile.elevation[0]?.dist).toBe(0);
    expect(profile.elevation[profile.elevation.length - 1]?.dist).toBe(49.99);
  });

  it('smooths single-point elevation noise instead of spiking', () => {
    // One bogus +5 m blip on an otherwise flat route: pointwise grade would
    // read 50%; the 30 m window keeps it in the low tens.
    const points = Array.from({ length: 101 }, (_, i) => {
      if (i === 50) return point(i * 10, 105);
      return point(i * 10, 100);
    });
    const profile = buildRouteProfile(points);
    const maxGrade = Math.max(...profile.grade.map((p) => Math.abs(p.grade)));
    expect(maxGrade).toBeLessThanOrEqual(20);
  });
});
