import type { RoutePoint } from './routeGeometry.ts';

export interface RouteProfilePoint {
  /** Distance from the route start in km — the chart x-value and map lookup key. */
  dist: number;
  lng: number;
  lat: number;
}

export interface RouteElevationPoint extends RouteProfilePoint {
  elevation: number;
}

export interface RouteGradePoint extends RouteProfilePoint {
  grade: number;
}

export interface RouteProfile {
  elevation: RouteElevationPoint[];
  grade: RouteGradePoint[];
}

/**
 * Grade at a point is the slope across a ~30 m window centered on it —
 * tight enough to keep short steep ramps visible, wide enough to absorb
 * single-point GPS elevation noise.
 */
const GRADE_HALF_WINDOW_M = 15;

const roundKm = (meters: number): number => Math.round(meters) / 1000;
const round1 = (value: number): number => Math.round(value * 10) / 10;

type ElevatedPoint = RoutePoint & { ele: number };

/**
 * Grades at FULL point resolution via a centered two-pointer window, computed
 * before any decimation — decimating first would silently widen the window to
 * the decimated sample spacing and flatten steep ramps on long routes.
 */
const computeGrades = (elevated: ElevatedPoint[]): number[] => {
  const grades = Array.from({ length: elevated.length }, () => 0);
  let lo = 0;
  let hi = 0;

  for (let i = 0; i < elevated.length; i++) {
    const point = elevated[i];
    if (!point) continue;

    let next = elevated[lo + 1];
    while (next && point.dist - next.dist >= GRADE_HALF_WINDOW_M) {
      lo++;
      next = elevated[lo + 1];
    }

    if (hi < i) hi = i;
    let ahead = elevated[hi];
    while (ahead && ahead.dist - point.dist < GRADE_HALF_WINDOW_M && hi < elevated.length - 1) {
      hi++;
      ahead = elevated[hi];
    }

    const a = elevated[lo];
    const b = elevated[hi];
    if (!a || !b) continue;
    const run = b.dist - a.dist;
    if (run >= GRADE_HALF_WINDOW_M) {
      grades[i] = ((b.ele - a.ele) / run) * 100;
    }
  }

  return grades;
};

export const buildRouteProfile = (points: RoutePoint[]): RouteProfile => {
  const elevated = points.filter((p): p is ElevatedPoint => p.ele != null);
  const grades = computeGrades(elevated);
  const elevation: RouteElevationPoint[] = [];
  const grade: RouteGradePoint[] = [];
  elevated.forEach((point, i) => {
    const dist = roundKm(point.dist);
    elevation.push({ dist, elevation: round1(point.ele), lng: point.lng, lat: point.lat });
    grade.push({ dist, grade: round1(grades[i] ?? 0), lng: point.lng, lat: point.lat });
  });

  return { elevation, grade };
};
