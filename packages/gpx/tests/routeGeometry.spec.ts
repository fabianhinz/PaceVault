import { describe, it, expect } from 'vite-plus/test';
import { buildRouteGeometry } from '../src/routeGeometry.ts';
import type { ParsedGpxPoint } from '../src/parseGpx.ts';
import { createMockParsedGpxPoint } from '../../testing/src/route.ts';

const pointAt = (lat: number, lng: number, ele?: number, seg = 0): ParsedGpxPoint =>
  createMockParsedGpxPoint({ lat, lng, ele, seg });

describe(buildRouteGeometry.name, () => {
  it('computes cumulative distance along the route', () => {
    const geometry = buildRouteGeometry([
      pointAt(47.0, 11.0),
      pointAt(47.01, 11.0),
      pointAt(47.02, 11.0),
    ]);
    expect(geometry).not.toBeNull();
    expect(geometry?.points[0]?.dist).toBe(0);
    expect(geometry?.points[1]?.dist).toBeCloseTo(1111.9, 0);
    expect(geometry?.points[2]?.dist).toBeCloseTo(2223.9, 0);
    expect(geometry?.distanceMeters).toBeCloseTo(2223.9, 0);
    expect(geometry?.points).toHaveLength(3);
  });

  it('computes bounds enclosing all points', () => {
    const geometry = buildRouteGeometry([
      pointAt(47.0, 11.5),
      pointAt(47.5, 11.0),
      pointAt(47.2, 11.8),
    ]);
    expect(geometry?.bounds).toEqual({ minLat: 47.0, maxLat: 47.5, minLng: 11.0, maxLng: 11.8 });
  });

  it('excludes the gap between segments from cumulative distance', () => {
    const geometry = buildRouteGeometry([
      pointAt(47.0, 11.0, undefined, 0),
      pointAt(47.01, 11.0, undefined, 0),
      pointAt(48.0, 11.0, undefined, 1),
      pointAt(48.01, 11.0, undefined, 1),
    ]);
    expect(geometry?.distanceMeters).toBeCloseTo(2223.9, 0);
    expect(geometry?.points[2]?.dist).toBeCloseTo(1111.9, 0);
    expect(geometry?.points[3]?.dist).toBeCloseTo(2223.9, 0);
  });

  it('computes elevation gain/loss with a 3 m hysteresis (ignores small jitter)', () => {
    const elevations = [100, 101, 100, 102, 101, 110, 109, 105];
    const points = elevations.map((ele, i) => pointAt(47 + i * 0.01, 11, ele));
    const geometry = buildRouteGeometry(points);
    expect(geometry?.elevation?.gain).toBe(10);
    expect(geometry?.elevation?.loss).toBe(5);
    expect(geometry?.elevation?.min).toBe(100);
    expect(geometry?.elevation?.max).toBe(110);
  });

  it('ignores elevation jumps between segments for gain/loss', () => {
    const geometry = buildRouteGeometry([
      pointAt(47.0, 11.0, 100, 0),
      pointAt(47.01, 11.0, 110, 0),
      pointAt(48.0, 11.0, 610, 1),
      pointAt(48.01, 11.0, 620, 1),
    ]);
    expect(geometry?.elevation?.gain).toBe(20);
    expect(geometry?.elevation?.loss).toBe(0);
    expect(geometry?.elevation?.min).toBe(100);
    expect(geometry?.elevation?.max).toBe(620);
  });

  it('does not measure max grade across segment boundaries', () => {
    const geometry = buildRouteGeometry([
      pointAt(47.0, 11.0, 100, 0),
      pointAt(47.001, 11.0, 100, 0),
      pointAt(47.002, 11.0, 600, 1),
      pointAt(47.003, 11.0, 600, 1),
    ]);
    expect(geometry?.elevation?.maxGrade).toBe(0);
  });

  it('computes max grade over a sustained window', () => {
    const points = [0, 1, 2, 3].map((i) => pointAt(47 + i * 0.001, 11, 100 + i * 11.119));
    const geometry = buildRouteGeometry(points);
    expect(geometry?.elevation?.maxGrade).toBeCloseTo(10, 0);
  });

  it('reports zero max grade for a flat or descending route', () => {
    const points = [0, 1, 2].map((i) => pointAt(47 + i * 0.001, 11, 200 - i * 10));
    const geometry = buildRouteGeometry(points);
    expect(geometry?.elevation?.maxGrade).toBe(0);
  });

  it('omits elevation stats when points have no elevation', () => {
    const geometry = buildRouteGeometry([pointAt(47.0, 11.0), pointAt(47.01, 11.0)]);
    expect(geometry?.elevation).toBeUndefined();
  });

  it('omits elevation stats when only one point has elevation', () => {
    const geometry = buildRouteGeometry([pointAt(47.0, 11.0, 100), pointAt(47.01, 11.0)]);
    expect(geometry?.elevation).toBeUndefined();
  });

  it('returns null for fewer than 2 points', () => {
    expect(buildRouteGeometry([])).toBeNull();
    expect(buildRouteGeometry([pointAt(47, 11)])).toBeNull();
  });
});
