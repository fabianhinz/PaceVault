// Sources: [Ramer1972], [DouglasPeucker1973]
// See packages/engine/SOURCES.md for full citations.

import { encode, decode } from '@googlemaps/polyline-codec';
import { Simplify as simplify } from 'simplify-ts';
import { boundsFromPoints } from '@pacevault/engine/bounds.ts';
import { isValidCoordinate } from '@pacevault/engine/geodesy.ts';
import type { GPSPoint, SessionGPS, SessionRecord } from '@pacevault/engine/types.ts';
import { groupBySegment } from '@pacevault/gpx/routeGeometry.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';

const SIMPLIFY_TOLERANCE_DEGREES = 0.00005;

const extractGPSPoints = (records: SessionRecord[]): GPSPoint[] =>
  records.reduce<GPSPoint[]>((acc, r) => {
    if (isValidCoordinate(r)) {
      acc.push({ lat: r.lat, lng: r.lng });
    }
    return acc;
  }, []);

const simplifyTrack = (points: GPSPoint[]): GPSPoint[] => {
  if (points.length < 3) return points;
  const simplified = simplify(
    points.map((p) => ({ x: p.lng, y: p.lat })),
    SIMPLIFY_TOLERANCE_DEGREES,
  );
  return simplified.map((p) => ({ lat: p.y, lng: p.x }));
};

const encodeTrack = (points: GPSPoint[]): string => encode(points.map((p) => [p.lat, p.lng]));

export const encodedSegmentPolylines = (points: RoutePoint[]): string[] =>
  groupBySegment(points).map((segment) => encodeTrack(simplifyTrack(segment)));

export const buildSessionGPS = ({
  sessionId,
  records,
}: {
  sessionId: string;
  records: SessionRecord[];
}): SessionGPS | null => {
  const points = extractGPSPoints(records);
  if (points.length < 2) return null;
  const simplified = simplifyTrack(points);
  const encodedPolyline = encodeTrack(simplified);
  const bounds = boundsFromPoints(simplified);
  return { sessionId, encodedPolyline, pointCount: simplified.length, bounds };
};

export const decodeTrackForRendering = (encodedPolyline: string): [number, number][] =>
  decode(encodedPolyline).map((p) => [p[1], p[0]]);
