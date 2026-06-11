// Sources: [Ramer1972], [DouglasPeucker1973], [LiangBarsky1984], [Veness2019]
// See src/engine/SOURCES.md for full citations.

import { encode, decode } from '@googlemaps/polyline-codec';
import { Simplify as simplify } from 'simplify-ts';
import type { SessionRecord, GPSPoint, GPSBounds, SessionGPS } from './types.ts';

/**
 * Test whether a record contains geographically valid coordinates (non-null and within WGS-84 range).
 */
export const isValidCoordinate = (r: { lat?: number | null; lng?: number | null }): boolean =>
  r.lat != null && r.lng != null && r.lat >= -90 && r.lat <= 90 && r.lng >= -180 && r.lng <= 180;

/** Convert an angle in degrees to radians. */
export const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Compute the initial bearing (forward azimuth) of the great-circle path from `a` to `b`.
 * @see [Veness2019] — standard initial-bearing formula.
 * @param a - Start point.
 * @param b - End point.
 * @returns Bearing in degrees, `0–360` measured clockwise from true north.
 */
export const bearingDeg = (a: GPSPoint, b: GPSPoint): number => {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
};

/**
 * Extract valid GPS points from an array of session records, filtering out nulls and out-of-range values.
 * @param records - Raw time-series records from a parsed FIT file.
 * @returns Array of `{lat, lng}` objects containing only geographically valid coordinates.
 */
const extractGPSPoints = (records: SessionRecord[]): GPSPoint[] =>
  records.reduce<GPSPoint[]>((acc, r) => {
    if (isValidCoordinate(r) && r.lat != null && r.lng != null) {
      acc.push({ lat: r.lat, lng: r.lng });
    }
    return acc;
  }, []);

/**
 * Extract valid GPS coordinates from session records as `[lng, lat]` tuples suitable for deck.gl / MapLibre layers.
 * @param records - Raw time-series records from a parsed FIT file.
 * @returns Array of `[lng, lat]` pairs containing only geographically valid coordinates.
 */
export const extractPathFromRecords = (records: SessionRecord[]): [number, number][] =>
  records.reduce<[number, number][]>((acc, r) => {
    if (isValidCoordinate(r) && r.lng != null && r.lat != null) {
      acc.push([r.lng, r.lat]);
    }
    return acc;
  }, []);

/**
 * Reduce the number of GPS points using the Ramer-Douglas-Peucker algorithm while preserving track shape.
 * @param points - Input GPS points to simplify.
 * @param tolerance - Maximum allowed deviation in degrees (default `0.00005`).
 * @returns Simplified array of GPS points; returns the original array unchanged when it has fewer than 3 points.
 */
const simplifyTrack = (points: GPSPoint[], tolerance = 0.00005): GPSPoint[] => {
  if (points.length < 3) return points;
  const simplified = simplify(
    points.map((p) => ({ x: p.lng, y: p.lat })),
    tolerance,
  );
  return simplified.map((p) => ({ lat: p.y, lng: p.x }));
};

/**
 * Encode an array of GPS points into a Google Polyline-encoded string for compact storage.
 * @param points - GPS points to encode.
 * @returns Polyline-encoded string representing the track.
 */
const encodeTrack = (points: GPSPoint[]): string => encode(points.map((p) => [p.lat, p.lng]));

/**
 * Compute the axis-aligned bounding box that tightly encloses all given GPS points.
 * @param points - GPS points to compute bounds for.
 * @returns `GPSBounds` with `minLat`, `maxLat`, `minLng`, and `maxLng`.
 */
const computeBounds = (points: GPSPoint[]): GPSBounds => {
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

/**
 * Build a complete `SessionGPS` object from raw session records, applying simplification and encoding.
 * @param sessionId - Unique identifier of the session these records belong to.
 * @param records - Raw time-series records from a parsed FIT file.
 * @returns A `SessionGPS` object ready for storage, or `null` when fewer than 2 valid GPS points are found.
 */
export const buildSessionGPS = (sessionId: string, records: SessionRecord[]): SessionGPS | null => {
  const points = extractGPSPoints(records);
  if (points.length < 2) return null;
  const simplified = simplifyTrack(points);
  const encodedPolyline = encodeTrack(simplified);
  const bounds = computeBounds(simplified);
  return { sessionId, encodedPolyline, pointCount: simplified.length, bounds };
};

/**
 * Decode a stored polyline string into `[lng, lat]` tuples ready for deck.gl / MapLibre rendering.
 * @param encodedPolyline - Google Polyline-encoded string produced by `encodeTrack`.
 * @returns Array of `[lng, lat]` pairs in the order expected by mapping layers.
 */
export const decodeTrackForRendering = (encodedPolyline: string): [number, number][] =>
  decode(encodedPolyline).map((p) => [p[1], p[0]]);

/**
 * Test whether two axis-aligned bounding boxes overlap in both latitude and longitude.
 * @param a - First bounding box.
 * @param b - Second bounding box.
 * @returns `true` when the boxes share at least one point, `false` otherwise.
 */
export const boundsOverlap = (a: GPSBounds, b: GPSBounds): boolean =>
  a.minLat <= b.maxLat && a.maxLat >= b.minLat && a.minLng <= b.maxLng && a.maxLng >= b.minLng;

/**
 * Compute the smallest bounding box that encloses every box in the input array.
 * @param boundsArray - Array of bounding boxes to merge.
 * @returns Union `GPSBounds`, or `null` when `boundsArray` is empty.
 */
const unionBounds = (boundsArray: GPSBounds[]): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const b of boundsArray) {
    if (b.minLat < minLat) minLat = b.minLat;
    if (b.maxLat > maxLat) maxLat = b.maxLat;
    if (b.minLng < minLng) minLng = b.minLng;
    if (b.maxLng > maxLng) maxLng = b.maxLng;
  }
  return { minLat, maxLat, minLng, maxLng };
};

/**
 * Test whether the line segment a→b intersects an axis-aligned bounding box.
 * Uses parametric clipping (Liang-Barsky). Coordinates are [lng, lat].
 * @param a - Start point of the segment as `[lng, lat]`.
 * @param b - End point of the segment as `[lng, lat]`.
 * @param bounds - Axis-aligned bounding box to test against.
 * @returns `true` when the segment intersects or touches the box, `false` otherwise.
 */
export const segmentIntersectsBounds = (
  a: [number, number],
  b: [number, number],
  bounds: GPSBounds,
): boolean => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];

  const p = [-dx, dx, -dy, dy];
  const q = [
    a[0] - bounds.minLng,
    bounds.maxLng - a[0],
    a[1] - bounds.minLat,
    bounds.maxLat - a[1],
  ];

  let tMin = 0;
  let tMax = 1;

  for (let i = 0; i < 4; i++) {
    const pi = p[i] ?? 0;
    const qi = q[i] ?? 0;
    if (pi === 0) {
      // Segment is parallel to this edge — reject if outside
      if (qi < 0) return false;
    } else {
      const t = qi / pi;
      if (pi < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }

  return tMin <= tMax;
};

/**
 * Compute the geographic center point of an axis-aligned bounding box.
 * @param b - Bounding box to find the center of.
 * @returns `GPSPoint` at the midpoint of the box's latitude and longitude extents.
 */
const boundsCenter = (b: GPSBounds): GPSPoint => ({
  lat: (b.minLat + b.maxLat) / 2,
  lng: (b.minLng + b.maxLng) / 2,
});

/**
 * Compute a cosine-corrected degree distance between two GPS points, approximating metres-per-degree scaling.
 * @param a - First GPS point.
 * @param b - Second GPS point.
 * @returns Scalar distance in degrees adjusted for longitude compression at the midpoint latitude.
 */
const scaledDistDeg = (a: GPSPoint, b: GPSPoint): number => {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

/**
 * Find the densest cluster of tracks by center-point proximity.
 * For each track center, count how many other centers are within radiusDeg.
 * Pick the center with the highest neighbor count, collect all tracks within
 * radius, and return their union bounds.
 * @param boundsArray - Bounding boxes of all tracks to consider.
 * @param radiusDeg - Search radius in (cosine-corrected) degrees (default `0.25`).
 * @returns Union `GPSBounds` of the densest cluster, or `null` when `boundsArray` is empty.
 */
export const densestClusterBounds = (
  boundsArray: GPSBounds[],
  radiusDeg = 0.25,
): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  const first = boundsArray[0];
  if (boundsArray.length === 1 && first) return first;

  const centers = boundsArray.map((b) => boundsCenter(b));

  let bestIdx = 0;
  let bestCount = 0;

  for (let i = 0; i < centers.length; i++) {
    const ci = centers[i];
    if (!ci) continue;
    let count = 0;
    for (let j = 0; j < centers.length; j++) {
      const cj = centers[j];
      if (!cj) continue;
      if (i !== j && scaledDistDeg(ci, cj) <= radiusDeg) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }

  const seed = centers[bestIdx];
  if (!seed) return null;
  const cluster = boundsArray.filter((_, idx) => {
    const c = centers[idx];
    if (!c) return false;
    return scaledDistDeg(seed, c) <= radiusDeg;
  });
  return unionBounds(cluster);
};
