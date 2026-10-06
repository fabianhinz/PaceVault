import type { RoutePoint } from './routeGeometry.ts';

export interface RoutePosition {
  lat: number;
  lng: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpKnown = (a: number | undefined, b: number | undefined, t: number): number | undefined => {
  if (a == null || b == null) return undefined;
  return lerp(a, b, t);
};

const interpolate = (a: RoutePoint, b: RoutePoint, distanceM: number): RoutePoint => {
  const t = (distanceM - a.dist) / (b.dist - a.dist);
  const point: RoutePoint = {
    lat: lerp(a.lat, b.lat, t),
    lng: lerp(a.lng, b.lng, t),
    seg: a.seg,
    dist: distanceM,
  };
  const ele = lerpKnown(a.ele, b.ele, t);
  if (ele != null) point.ele = ele;
  const time = lerpKnown(a.time, b.time, t);
  if (time != null) point.time = Math.round(time);
  return point;
};

const firstIndexAtOrAfter = (points: RoutePoint[], distanceM: number): number => {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const point = points[mid];
    if (point && point.dist < distanceM) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};

export const pointAtRouteDistance = (
  points: RoutePoint[],
  distanceM: number,
): RoutePoint | null => {
  const index = firstIndexAtOrAfter(points, distanceM);
  const at = points[index];
  if (!at) return points[points.length - 1] ?? null;
  const before = points[index - 1];
  if (!before || at.dist === distanceM) return at;
  return interpolate(before, at, distanceM);
};

export const sliceRoute = (points: RoutePoint[], startM: number, endM: number): RoutePoint[] => {
  const last = points[points.length - 1];
  if (!last || endM <= startM) return [];

  const startIdx = firstIndexAtOrAfter(points, startM);
  let endIdx = firstIndexAtOrAfter(points, endM);
  if (endM >= last.dist) endIdx = points.length;

  const slice: RoutePoint[] = [];
  const startAt = points[startIdx];
  const beforeStart = points[startIdx - 1];
  if (startAt && beforeStart && startAt.dist > startM) {
    slice.push(interpolate(beforeStart, startAt, startM));
  }

  for (let i = startIdx; i < endIdx; i++) {
    const point = points[i];
    if (point) slice.push(point);
  }

  const endAt = points[endIdx];
  const beforeEnd = points[endIdx - 1];
  if (endAt && endAt.dist === endM) {
    slice.push(endAt);
  } else if (endAt && beforeEnd) {
    slice.push(interpolate(beforeEnd, endAt, endM));
  }

  return slice;
};

export const routeDistanceAtPosition = (
  points: RoutePoint[],
  click: RoutePosition,
): number | null => {
  const cosLat = Math.cos((click.lat * Math.PI) / 180);
  const cx = click.lng * cosLat;
  const cy = click.lat;

  let bestSq = Infinity;
  let bestAt: number | null = null;

  for (let i = 0; i < points.length; i++) {
    const b = points[i];
    if (!b) continue;
    let a = points[i - 1];
    if (!a || a.seg !== b.seg) a = b;

    const ax = a.lng * cosLat;
    const ay = a.lat;
    const dx = b.lng * cosLat - ax;
    const dy = b.lat - ay;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lenSq));
    }

    const ex = cx - (ax + dx * t);
    const ey = cy - (ay + dy * t);
    const distSq = ex * ex + ey * ey;
    if (distSq < bestSq) {
      bestSq = distSq;
      bestAt = a.dist + (b.dist - a.dist) * t;
    }
  }

  return bestAt;
};
