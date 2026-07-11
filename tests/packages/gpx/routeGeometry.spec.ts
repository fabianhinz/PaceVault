import { describe, it, expect } from 'vitest';
import { decode } from '@googlemaps/polyline-codec';
import { buildRouteGeometry } from '@/packages/gpx/routeGeometry.ts';
import type { ParsedGpxPoint } from '@/packages/gpx/parseGpx.ts';

const point = (lat: number, lng: number, ele?: number): ParsedGpxPoint => ({
  lat,
  lng,
  ele,
  seg: 0,
});

describe('buildRouteGeometry', () => {
  it('computes cumulative distance along the route', () => {
    // ~0.01° latitude ≈ 1111.9 m
    const geometry = buildRouteGeometry([
      point(47.0, 11.0),
      point(47.01, 11.0),
      point(47.02, 11.0),
    ]);
    expect(geometry).not.toBeNull();
    expect(geometry?.points[0]?.dist).toBe(0);
    expect(geometry?.points[1]?.dist).toBeCloseTo(1111.9, 0);
    expect(geometry?.points[2]?.dist).toBeCloseTo(2223.9, 0);
    expect(geometry?.distance).toBeCloseTo(2223.9, 0);
    expect(geometry?.pointCount).toBe(3);
  });

  it('computes bounds enclosing all points', () => {
    const geometry = buildRouteGeometry([point(47.0, 11.5), point(47.5, 11.0), point(47.2, 11.8)]);
    expect(geometry?.bounds).toEqual({ minLat: 47.0, maxLat: 47.5, minLng: 11.0, maxLng: 11.8 });
  });

  it('encodes a decodable polyline', () => {
    const geometry = buildRouteGeometry([point(47.0, 11.0), point(47.01, 11.01)]);
    const decoded = decode(geometry?.encodedPolyline ?? '');
    expect(decoded).toHaveLength(2);
    expect(decoded[0]?.[0]).toBeCloseTo(47.0, 4);
    expect(decoded[0]?.[1]).toBeCloseTo(11.0, 4);
  });

  it('computes elevation gain/loss with hysteresis (ignores small jitter)', () => {
    const elevations = [100, 101, 100, 102, 101, 110, 109, 105];
    const points = elevations.map((ele, i) => point(47 + i * 0.01, 11, ele));
    const geometry = buildRouteGeometry(points);
    // Jitter below 3 m is ignored; 100 → 110 counts as gain, 110 → 105 as loss.
    expect(geometry?.elevation?.gain).toBe(10);
    expect(geometry?.elevation?.loss).toBe(5);
    expect(geometry?.elevation?.min).toBe(100);
    expect(geometry?.elevation?.max).toBe(110);
  });

  it('computes max grade over a sustained window', () => {
    // Points 111 m apart climbing 11.1 m each → ~10% grade.
    const points = [0, 1, 2, 3].map((i) => point(47 + i * 0.001, 11, 100 + i * 11.119));
    const geometry = buildRouteGeometry(points);
    expect(geometry?.elevation?.maxGrade).toBeCloseTo(10, 0);
  });

  it('reports zero max grade for a flat or descending route', () => {
    const points = [0, 1, 2].map((i) => point(47 + i * 0.001, 11, 200 - i * 10));
    const geometry = buildRouteGeometry(points);
    expect(geometry?.elevation?.maxGrade).toBe(0);
  });

  it('omits elevation stats when points have no elevation', () => {
    const geometry = buildRouteGeometry([point(47.0, 11.0), point(47.01, 11.0)]);
    expect(geometry?.elevation).toBeUndefined();
  });

  it('omits elevation stats when only one point has elevation', () => {
    const geometry = buildRouteGeometry([point(47.0, 11.0, 100), point(47.01, 11.0)]);
    expect(geometry?.elevation).toBeUndefined();
  });

  it('returns null for fewer than 2 points', () => {
    expect(buildRouteGeometry([])).toBeNull();
    expect(buildRouteGeometry([point(47, 11)])).toBeNull();
  });
});
