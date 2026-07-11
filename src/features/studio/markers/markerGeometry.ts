import { haversineM } from '@/packages/engine/gps.ts';
import { decodeCached } from '@/features/map/hooks/types.ts';

/** A point along the route as `[lng, lat]` (deck.gl / maplibre order). */
export type LngLat = [number, number];

/**
 * Interpolate the `[lng, lat]` position at a given distance from the route
 * start. Segments are walked in order and their lengths accumulate — the same
 * cumulative model the km-from-start input uses. Returns `null` for an empty
 * route.
 */
export const positionAtDistance = (
  routeId: string,
  encodedPolylines: string[],
  distanceM: number,
): LngLat | null => {
  let remaining = Math.max(0, distanceM);
  let last: LngLat | null = null;

  for (let seg = 0; seg < encodedPolylines.length; seg++) {
    const encoded = encodedPolylines[seg];
    if (encoded === undefined) continue;
    const path = decodeCached(`${routeId}:${seg}`, encoded);

    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      if (point === undefined) continue;
      last = point;
      if (i === 0) continue;

      const prev = path[i - 1];
      if (prev === undefined) continue;
      const stepM = haversineM({ lat: prev[1], lng: prev[0] }, { lat: point[1], lng: point[0] });
      if (stepM >= remaining) {
        const t = stepM === 0 ? 0 : remaining / stepM;
        return [prev[0] + (point[0] - prev[0]) * t, prev[1] + (point[1] - prev[1]) * t];
      }
      remaining -= stepM;
    }
  }

  // distanceM beyond the route end — clamp to the last point.
  return last;
};

/**
 * Inverse of {@link positionAtDistance}: given a clicked `[lng, lat]`, find the
 * closest point on the route and return its distance from the start in metres.
 * Each segment vertex pair is projected in a local equirectangular plane (lng
 * scaled by cos(lat)) so the nearest point is found consistently; the returned
 * distance uses the same cumulative, gap-free model markers are stored in.
 */
export const distanceAtPosition = (
  routeId: string,
  encodedPolylines: string[],
  click: LngLat,
): number => {
  const cosLat = Math.cos((click[1] * Math.PI) / 180);
  const cx = click[0] * cosLat;
  const cy = click[1];

  let cumulative = 0;
  let bestSq = Infinity;
  let bestAt = 0;

  for (let seg = 0; seg < encodedPolylines.length; seg++) {
    const encoded = encodedPolylines[seg];
    if (encoded === undefined) continue;
    const path = decodeCached(`${routeId}:${seg}`, encoded);

    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (a === undefined || b === undefined) continue;

      const segLen = haversineM({ lat: a[1], lng: a[0] }, { lat: b[1], lng: b[0] });
      const ax = a[0] * cosLat;
      const ay = a[1];
      const dx = b[0] * cosLat - ax;
      const dy = b[1] - ay;
      const lenSq = dx * dx + dy * dy;

      let t = 0;
      if (lenSq > 0) {
        t = ((cx - ax) * dx + (cy - ay) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
      }

      const ex = cx - (ax + dx * t);
      const ey = cy - (ay + dy * t);
      const distSq = ex * ex + ey * ey;
      if (distSq < bestSq) {
        bestSq = distSq;
        bestAt = cumulative + segLen * t;
      }
      cumulative += segLen;
    }
  }

  return bestAt;
};
