import { describe, it, expect } from 'vitest';
import { decode } from '@googlemaps/polyline-codec';
import { buildRouteGeometry } from '@/packages/gpx/routeGeometry.ts';
import type { ParsedGpxPoint } from '@/packages/gpx/parseGpx.ts';

const point = (lat: number, lng: number, ele?: number, seg = 0): ParsedGpxPoint => ({
  lat,
  lng,
  ele,
  seg,
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
    expect(geometry?.encodedPolylines).toHaveLength(1);
    const decoded = decode(geometry?.encodedPolylines[0] ?? '');
    expect(decoded).toHaveLength(2);
    expect(decoded[0]?.[0]).toBeCloseTo(47.0, 4);
    expect(decoded[0]?.[1]).toBeCloseTo(11.0, 4);
  });

  it('encodes one polyline per segment', () => {
    const geometry = buildRouteGeometry([
      point(47.0, 11.0, undefined, 0),
      point(47.01, 11.0, undefined, 0),
      point(48.0, 12.0, undefined, 1),
      point(48.01, 12.0, undefined, 1),
    ]);
    expect(geometry?.encodedPolylines).toHaveLength(2);
    const first = decode(geometry?.encodedPolylines[0] ?? '');
    const second = decode(geometry?.encodedPolylines[1] ?? '');
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    expect(first[0]?.[0]).toBeCloseTo(47.0, 4);
    expect(second[0]?.[0]).toBeCloseTo(48.0, 4);
  });

  it('excludes the gap between segments from cumulative distance', () => {
    // Two segments of ~1111.9 m each, separated by a ~111 km jump.
    const geometry = buildRouteGeometry([
      point(47.0, 11.0, undefined, 0),
      point(47.01, 11.0, undefined, 0),
      point(48.0, 11.0, undefined, 1),
      point(48.01, 11.0, undefined, 1),
    ]);
    expect(geometry?.distance).toBeCloseTo(2223.9, 0);
    // The second segment continues from the first segment's end distance.
    expect(geometry?.points[2]?.dist).toBeCloseTo(1111.9, 0);
    expect(geometry?.points[3]?.dist).toBeCloseTo(2223.9, 0);
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

  it('ignores elevation jumps between segments for gain/loss', () => {
    // Segment 0 climbs 100 → 110; segment 1 starts 500 m higher and climbs 610 → 620.
    // The 490 m cross-segment jump must not count as gain.
    const geometry = buildRouteGeometry([
      point(47.0, 11.0, 100, 0),
      point(47.01, 11.0, 110, 0),
      point(48.0, 11.0, 610, 1),
      point(48.01, 11.0, 620, 1),
    ]);
    expect(geometry?.elevation?.gain).toBe(20);
    expect(geometry?.elevation?.loss).toBe(0);
    expect(geometry?.elevation?.min).toBe(100);
    expect(geometry?.elevation?.max).toBe(620);
  });

  it('does not measure max grade across segment boundaries', () => {
    // Each segment is flat; only the cross-segment jump gains elevation.
    const geometry = buildRouteGeometry([
      point(47.0, 11.0, 100, 0),
      point(47.001, 11.0, 100, 0),
      point(47.002, 11.0, 600, 1),
      point(47.003, 11.0, 600, 1),
    ]);
    expect(geometry?.elevation?.maxGrade).toBe(0);
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
