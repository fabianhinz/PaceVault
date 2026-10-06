import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { decode } from '@googlemaps/polyline-codec';
import { haversineM } from '@/packages/engine/gps.ts';
import { parseGpx, type ParsedGpxPoint } from '@/packages/gpx/parseGpx.ts';
import { buildRouteGeometry, type RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import {
  pointAtRouteDistance,
  routeDistanceAtPosition,
  sliceRoute,
} from '@/packages/gpx/routeCut.ts';

const START_MS = Date.parse('2025-08-17T06:00:00Z');

const denseTrack = (count: number): ParsedGpxPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: 47 + i * 0.00002,
    lng: 11 + 0.00002 * Math.sin(i * 1.3),
    ele: 600 + Math.sin(i / 10) * 5,
    time: START_MS + i * 1000,
    seg: 0,
  }));

const geometryOf = (parsed: ParsedGpxPoint[]) => {
  const geometry = buildRouteGeometry(parsed);
  if (!geometry) throw new Error('route needs at least two points');
  return geometry;
};

const fixturePoints = (): RoutePoint[] => {
  const text = fs.readFileSync(path.resolve(__dirname, '../../../e2e/fixtures/route.gpx'), 'utf8');
  const parsed = parseGpx(text);
  if (!parsed) throw new Error('fixture must parse');
  return geometryOf(parsed.points).points;
};

const cutAll = (points: RoutePoint[], splitsM: number[], totalM: number): RoutePoint[][] => {
  const bounds = [0, ...splitsM, totalM];
  return bounds.slice(1).map((endM, i) => sliceRoute(points, bounds[i] ?? 0, endM));
};

const pathLength = (points: RoutePoint[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) total += haversineM(a, b);
  }
  return total;
};

const expectSegmentsRebuildRoute = (points: RoutePoint[], splitsM: number[], totalM: number) => {
  const segments = cutAll(points, splitsM, totalM);

  segments.forEach((segment, i) => {
    const next = segments[i + 1];
    if (next) expect(segment.at(-1)).toEqual(next[0]);
  });

  const joined = segments.flatMap((segment, i) => {
    if (i === 0) return segment;
    return segment.slice(1);
  });
  const real = joined.filter((p) => points.includes(p));
  expect(real).toEqual(points);
  expect(joined.length - real.length).toBeLessThanOrEqual(splitsM.length);

  const summed = segments.reduce((sum, segment) => sum + pathLength(segment), 0);
  expect(summed).toBeCloseTo(pathLength(points), 2);
};

describe('sliceRoute', () => {
  const route = geometryOf(denseTrack(400));

  it('ends a segment on an interpolated point exactly at the split, not on the last point before it', () => {
    const a = route.points[100];
    const b = route.points[101];
    if (!a || !b) throw new Error('fixture too short');
    const splitM = (a.dist + b.dist) / 2;

    const before = sliceRoute(route.points, 0, splitM);
    const after = sliceRoute(route.points, splitM, route.distance);
    const cut = before.at(-1);

    expect(cut?.dist).toBe(splitM);
    expect(cut?.lat).toBeCloseTo((a.lat + b.lat) / 2, 9);
    expect(cut?.lng).toBeCloseTo((a.lng + b.lng) / 2, 9);
    expect(cut?.ele).toBeCloseTo(((a.ele ?? 0) + (b.ele ?? 0)) / 2, 9);
    expect(cut?.time).toBe(START_MS + 100_500);
    expect(after[0]).toEqual(cut);
    expect(before.at(-2)).toBe(a);
    expect(after[1]).toBe(b);
  });

  it('segments rebuild the dense track: every point once, distances sum to the total', () => {
    expectSegmentsRebuildRoute(
      route.points,
      [0.137, 0.4012, 0.8007].map((f) => route.distance * f),
      route.distance,
    );
  });

  it('segments rebuild the sparse fixture route without losing the stretch across a split', () => {
    const points = fixturePoints();
    const total = points.at(-1)?.dist ?? 0;
    expectSegmentsRebuildRoute(points, [total * 0.187, total * 0.533, total * 0.811], total);
  });

  it('shares a point lying exactly on a split only as the join', () => {
    const onSplit = route.points[200];
    if (!onSplit) throw new Error('fixture too short');

    const before = sliceRoute(route.points, 0, onSplit.dist);
    const after = sliceRoute(route.points, onSplit.dist, route.distance);

    expect(before.at(-1)).toBe(onSplit);
    expect(after[0]).toBe(onSplit);
    expect(before.length + after.length).toBe(route.points.length + 1);
  });

  it('never invents a time when a neighbour has none', () => {
    const parsed = denseTrack(10);
    const second = parsed[5];
    if (second) second.time = undefined;
    const points = geometryOf(parsed).points;
    const a = points[4];
    const b = points[5];
    if (!a || !b) throw new Error('fixture too short');

    const cut = sliceRoute(points, 0, (a.dist + b.dist) / 2).at(-1);

    expect(cut?.time).toBeUndefined();
    expect(cut?.ele).toBeDefined();
  });

  it('returns no points for an empty range', () => {
    expect(sliceRoute(route.points, 500, 500)).toEqual([]);
  });
});

describe('pointAtRouteDistance', () => {
  const route = geometryOf(denseTrack(800));

  it('split pin drifts ahead of the export cut on simplified line', () => {
    const simplified = decode(route.encodedPolylines[0] ?? '');
    expect(simplified.length).toBeLessThan(route.points.length);

    for (const splitM of [0.3, 0.65, 0.9].map((f) => route.distance * f)) {
      const pin = pointAtRouteDistance(route.points, splitM);
      const cut = sliceRoute(route.points, splitM, route.distance)[0];
      expect(pin).not.toBeNull();
      expect(pin?.lat).toBe(cut?.lat);
      expect(pin?.lng).toBe(cut?.lng);
    }
  });

  it('clamps beyond the route ends', () => {
    expect(pointAtRouteDistance(route.points, -10)).toBe(route.points[0]);
    expect(pointAtRouteDistance(route.points, route.distance + 1000)).toBe(route.points.at(-1));
  });

  it('returns null for an empty route', () => {
    expect(pointAtRouteDistance([], 100)).toBeNull();
  });
});

describe('routeDistanceAtPosition', () => {
  const route = geometryOf(denseTrack(800));

  it('map click saves a shorter km than the export uses', () => {
    for (const index of [137, 446, 695]) {
      const recorded = route.points[index];
      if (!recorded) throw new Error('fixture too short');
      expect(routeDistanceAtPosition(route.points, recorded)).toBeCloseTo(recorded.dist, 6);
    }
  });

  it('round-trips with pointAtRouteDistance between recorded points', () => {
    const target = route.distance * 0.4321;
    const pin = pointAtRouteDistance(route.points, target);
    if (!pin) throw new Error('pin expected');
    expect(routeDistanceAtPosition(route.points, pin)).toBeCloseTo(target, 3);
  });

  it('does not bridge the gap between disconnected GPX segments', () => {
    const points = geometryOf([
      { lat: 0, lng: 0, seg: 0 },
      { lat: 0, lng: 1, seg: 0 },
      { lat: 0, lng: 10, seg: 1 },
      { lat: 0, lng: 11, seg: 1 },
    ]).points;
    const firstEnd = points[1]?.dist ?? 0;

    expect(routeDistanceAtPosition(points, { lat: 0, lng: 5 })).toBeCloseTo(firstEnd, 3);
    expect(routeDistanceAtPosition(points, { lat: 0, lng: 10.5 })).toBeCloseTo(firstEnd * 1.5, -1);
  });

  it('returns null for an empty route', () => {
    expect(routeDistanceAtPosition([], { lat: 0, lng: 0 })).toBeNull();
  });
});
