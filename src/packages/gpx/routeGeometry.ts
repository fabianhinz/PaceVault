import { encode } from '@googlemaps/polyline-codec';
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
  encodedPolyline: string;
  bounds: GPSBounds;
  /** Total route distance in metres. */
  distance: number;
  pointCount: number;
  elevation?: RouteElevationStats;
}

const EARTH_RADIUS_M = 6371000;
/** Elevation changes smaller than this are treated as GPS noise, not gain/loss. */
const ELEVATION_HYSTERESIS_M = 3;
/** Minimum horizontal distance over which a grade is considered sustained. */
const GRADE_WINDOW_M = 50;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

const haversineM = (a: ParsedGpxPoint, b: ParsedGpxPoint): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
};

const computeBounds = (points: RoutePoint[]): GPSBounds => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
};

const computeElevationStats = (points: RoutePoint[]): RouteElevationStats | undefined => {
  const elevated = points.filter((p): p is RoutePoint & { ele: number } => p.ele != null);
  if (elevated.length < 2) return undefined;

  let min = Infinity;
  let max = -Infinity;
  let gain = 0;
  let loss = 0;
  const firstPoint = elevated[0];
  if (!firstPoint) return undefined;
  let ref = firstPoint.ele;

  for (const p of elevated) {
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
  let maxGrade = 0;
  let start = 0;
  for (let end = 1; end < elevated.length; end++) {
    const endPoint = elevated[end];
    if (!endPoint) continue;
    let next = elevated[start + 1];
    while (next && endPoint.dist - next.dist >= GRADE_WINDOW_M) {
      start++;
      next = elevated[start + 1];
    }
    const startPoint = elevated[start];
    if (!startPoint) continue;
    const run = endPoint.dist - startPoint.dist;
    if (run < GRADE_WINDOW_M) continue;
    const grade = ((endPoint.ele - startPoint.ele) / run) * 100;
    if (grade > maxGrade) maxGrade = grade;
  }

  return { gain, loss, min, max, maxGrade };
};

/**
 * Derive everything the studio needs from parsed GPX points: cumulative
 * distances, bounds, elevation stats and a simplified encoded polyline for
 * map rendering. Returns `null` when fewer than 2 points are provided.
 */
export const buildRouteGeometry = (parsedPoints: ParsedGpxPoint[]): RouteGeometry | null => {
  if (parsedPoints.length < 2) return null;

  const points: RoutePoint[] = [];
  let dist = 0;
  let prev: ParsedGpxPoint | null = null;
  for (const p of parsedPoints) {
    if (prev) {
      dist += haversineM(prev, p);
    }
    points.push({ ...p, dist });
    prev = p;
  }

  const simplified = simplifyGpxPoints(points.map((p) => ({ lat: p.lat, lon: p.lng })));
  const encodedPolyline = encode(simplified.map((p) => [p.lat, p.lon]));

  return {
    points,
    encodedPolyline,
    bounds: computeBounds(points),
    distance: dist,
    pointCount: points.length,
    elevation: computeElevationStats(points),
  };
};
