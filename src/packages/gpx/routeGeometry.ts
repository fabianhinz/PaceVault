import { encode } from '@googlemaps/polyline-codec';
import { computeBounds, haversineM } from '../engine/gps.ts';
import { windowedGradients } from '../engine/gradient.ts';
import type { GPSBounds } from '../engine/types.ts';
import type { ParsedGpxPoint } from './parseGpx.ts';
import { simplifyGpxPoints } from './simplifyGpxPoints.ts';

export interface RoutePoint extends ParsedGpxPoint {
  dist: number;
}

export interface RouteElevationStats {
  gain: number;
  loss: number;
  min: number;
  max: number;
  maxGrade: number;
}

interface RouteGeometry {
  points: RoutePoint[];
  encodedPolylines: string[];
  bounds: GPSBounds;
  distance: number;
  elevation?: RouteElevationStats;
}

const ELEVATION_HYSTERESIS_M = 3;

export const groupBySegment = <T extends { seg: number }>(points: T[]): T[][] => {
  const segments: T[][] = [];
  let current: T[] = [];
  let currentSeg: number | null = null;
  for (const p of points) {
    if (currentSeg !== null && p.seg !== currentSeg && current.length > 0) {
      segments.push(current);
      current = [];
    }
    currentSeg = p.seg;
    current.push(p);
  }
  if (current.length > 0) segments.push(current);
  return segments;
};

const steepestGrade = (points: RoutePoint[]): number => {
  let maxGrade = 0;
  for (const segment of groupBySegment(points)) {
    const gradients = windowedGradients(
      segment.map((p) => ({ distance: p.dist, elevation: p.ele })),
    );
    for (const gradient of gradients) {
      if (gradient !== undefined && gradient * 100 > maxGrade) maxGrade = gradient * 100;
    }
  }
  return maxGrade;
};

const computeElevationStats = (points: RoutePoint[]): RouteElevationStats | undefined => {
  const elevated = points.filter((p): p is RoutePoint & { ele: number } => p.ele !== undefined);
  if (elevated.length < 2) return undefined;

  let min = Infinity;
  let max = -Infinity;
  let gain = 0;
  let loss = 0;

  for (const segment of groupBySegment(elevated)) {
    const firstPoint = segment[0];
    if (!firstPoint) continue;
    let ref = firstPoint.ele;

    for (const p of segment) {
      if (p.ele < min) min = p.ele;
      if (p.ele > max) max = p.ele;
      const delta = p.ele - ref;
      if (delta >= ELEVATION_HYSTERESIS_M) {
        gain += delta;
        ref = p.ele;
      } else if (delta <= -ELEVATION_HYSTERESIS_M) {
        loss += -delta;
        ref = p.ele;
      }
    }
  }

  return { gain, loss, min, max, maxGrade: steepestGrade(points) };
};

export const buildRouteGeometry = (parsedPoints: ParsedGpxPoint[]): RouteGeometry | null => {
  if (parsedPoints.length < 2) return null;

  const points: RoutePoint[] = [];
  let dist = 0;
  let prev: ParsedGpxPoint | null = null;
  for (const p of parsedPoints) {
    if (prev && prev.seg === p.seg) {
      dist += haversineM(prev, p);
    }
    points.push({ ...p, dist });
    prev = p;
  }

  const encodedPolylines = groupBySegment(points).map((segment) => {
    const simplified = simplifyGpxPoints(segment.map((p) => ({ lat: p.lat, lon: p.lng })));
    return encode(simplified.map((p) => [p.lat, p.lon]));
  });

  return {
    points,
    encodedPolylines,
    bounds: computeBounds(points),
    distance: dist,
    elevation: computeElevationStats(points),
  };
};
