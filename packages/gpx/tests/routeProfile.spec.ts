import { describe, it, expect } from 'vite-plus/test';
import { buildRouteProfile } from '../src/routeProfile.ts';
import type { RoutePoint } from '../src/types.ts';
import { createMockRoutePoint } from '../../testing/src/route.ts';

const pointAtDistance = (dist: number, ele?: number): RoutePoint =>
  createMockRoutePoint({ lat: 47 + dist / 111_190, ele, dist });

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
    points.push(pointAtDistance(d, ele));
  }
  return points;
};

describe(buildRouteProfile.name, () => {
  it('emits aligned elevation and grade series with identical dist keys', () => {
    const profile = buildRouteProfile(routeWithRamp(1000, 400, 600, 10));
    expect(profile.grade).toHaveLength(profile.elevation.length);
    expect(profile.grade.map((p) => p.distanceMeters)).toEqual(
      profile.elevation.map((p) => p.distanceMeters),
    );
  });

  it('keeps distance in metres and the recorded elevation', () => {
    const profile = buildRouteProfile([pointAtDistance(0, 500.04), pointAtDistance(1500, 620.26)]);
    expect(profile.elevation[0]).toMatchObject({
      distanceMeters: 0,
      elevationMeters: 500.04,
      lng: 11,
    });
    expect(profile.elevation[1]).toMatchObject({ distanceMeters: 1500, elevationMeters: 620.26 });
  });

  it('skips points without elevation', () => {
    const profile = buildRouteProfile([
      pointAtDistance(0, 500),
      pointAtDistance(100),
      pointAtDistance(200, 510),
    ]);
    expect(profile.elevation.map((p) => p.distanceMeters)).toEqual([0, 200]);
  });

  it('returns empty series when no point has elevation', () => {
    const profile = buildRouteProfile([pointAtDistance(0), pointAtDistance(100)]);
    expect(profile.elevation).toEqual([]);
    expect(profile.grade).toEqual([]);
  });

  it('computes grade over a centered window on a constant climb', () => {
    const points = Array.from({ length: 51 }, (_, i) => pointAtDistance(i * 10, 100 + i));
    const profile = buildRouteProfile(points);
    const middle = profile.grade[25];
    expect(middle?.gradePercent).toBeCloseTo(10, 9);
  });

  it('reports negative grade on descents', () => {
    const points = Array.from({ length: 51 }, (_, i) => pointAtDistance(i * 10, 500 - i * 0.5));
    const profile = buildRouteProfile(points);
    expect(profile.grade[25]?.gradePercent).toBeCloseTo(-5, 9);
  });

  it('preserves the full steepness of a sustained ramp', () => {
    const profile = buildRouteProfile(routeWithRamp(2000, 1000, 1200, 14));
    const maxGrade = Math.max(...profile.grade.map((p) => p.gradePercent ?? -Infinity));
    expect(maxGrade).toBeCloseTo(14, 0);
  });

  it('keeps every elevated point at full resolution', () => {
    const points = Array.from({ length: 5000 }, (_, i) => pointAtDistance(i * 10, 100 + i));
    const profile = buildRouteProfile(points);
    expect(profile.elevation).toHaveLength(5000);
    expect(profile.elevation[profile.elevation.length - 1]?.distanceMeters).toBe(49_990);
  });

  it('smooths single-point elevation noise instead of spiking', () => {
    const points = Array.from({ length: 101 }, (_, i) => {
      if (i === 50) return pointAtDistance(i * 10, 105);
      return pointAtDistance(i * 10, 100);
    });
    const profile = buildRouteProfile(points);
    const maxGrade = Math.max(...profile.grade.map((p) => Math.abs(p.gradePercent ?? 0)));
    expect(maxGrade).toBeLessThanOrEqual(20);
  });
});
