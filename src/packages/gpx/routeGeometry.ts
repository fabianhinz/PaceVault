import { encode } from '@googlemaps/polyline-codec';
import { computeBounds, haversineM } from '../engine/gps.ts';
import type { GPSBounds } from '../engine/types.ts';
import type { ParsedGpxPoint } from './parseGpx.ts';
import { simplifyGpxPoints } from './simplifyGpxPoints.ts';

export interface RoutePoint extends ParsedGpxPoint {
  /** Cumulative distance from the route start in metres. */
  dist: number;
}

export interface RouteElevationStats {
  gain: number;
  loss: number;
  min: number;
  max: number;
  /** Steepest sustained climb in percent, measured over windows of at least GRADE_WINDOW_M. */
  maxGrade: number;
}

export interface RouteGeometry {
  points: RoutePoint[];
  /** One encoded polyline per GPX segment — disconnected segments stay disconnected. */
  encodedPolylines: string[];
  bounds: GPSBounds;
  /** Total route distance in metres. */
  distance: number;
  elevation?: RouteElevationStats;
}

/** Elevation changes smaller than this are treated as GPS noise, not gain/loss. */
const ELEVATION_HYSTERESIS_M = 3;
/** Minimum horizontal distance over which a grade is considered sustained. */
const GRADE_WINDOW_M = 50;

const groupBySegment = <T extends { seg: number }>(points: T[]): T[][] => {
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

const computeElevationStats = (points: RoutePoint[]): RouteElevationStats | undefined => {
  const elevated = points.filter((p): p is RoutePoint & { ele: number } => p.ele != null);
  if (elevated.length < 2) return undefined;

  let min = Infinity;
  let max = -Infinity;
  let gain = 0;
  let loss = 0;
  let maxGrade = 0;

  // Gain/loss and grade never cross segment boundaries — the jump between two
  // disconnected segments is not terrain.
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

    // Two-pointer sweep: for each end point use the tightest window still >= GRADE_WINDOW_M.
    let start = 0;
    for (let end = 1; end < segment.length; end++) {
      const endPoint = segment[end];
      if (!endPoint) continue;
      let next = segment[start + 1];
      while (next && endPoint.dist - next.dist >= GRADE_WINDOW_M) {
        start++;
        next = segment[start + 1];
      }
      const startPoint = segment[start];
      if (!startPoint) continue;
      const run = endPoint.dist - startPoint.dist;
      if (run < GRADE_WINDOW_M) continue;
      const grade = ((endPoint.ele - startPoint.ele) / run) * 100;
      if (grade > maxGrade) maxGrade = grade;
    }
  }

  return { gain, loss, min, max, maxGrade };
};

/**
 * Derive everything the studio needs from parsed GPX points: cumulative
 * distances, bounds, elevation stats and one simplified encoded polyline per
 * segment for map rendering. Disconnected segments contribute neither distance
 * nor a connecting line. Returns `null` when fewer than 2 points are provided.
 */
export const buildRouteGeometry = (parsedPoints: ParsedGpxPoint[]): RouteGeometry | null => {
  if (parsedPoints.length < 2) return null;

  const points: RoutePoint[] = [];
  let dist = 0;
  let prev: ParsedGpxPoint | null = null;
  for (const p of parsedPoints) {
    // The gap between two segments is not ridden distance.
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
