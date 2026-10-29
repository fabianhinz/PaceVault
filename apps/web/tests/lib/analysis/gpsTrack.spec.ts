import { describe, it, expect } from 'vite-plus/test';
import { decode } from '@googlemaps/polyline-codec';
import { buildRouteGeometry } from '@pacevault/gpx/routeGeometry.ts';
import type { ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
import { gpsRunningRecordSeries, indoorRecordSeries } from '@pacevault/testing/series.ts';
import { buildSessionGPS, encodedSegmentPolylines } from '@/lib/analysis/gpsTrack.ts';

const point = (lat: number, lng: number, seg = 0): ParsedGpxPoint => ({ lat, lng, seg });

const routePoints = (points: ParsedGpxPoint[]) => buildRouteGeometry(points)?.points ?? [];

describe(buildSessionGPS.name, () => {
  it('returns null for < 2 GPS points', () => {
    const records = [{ sessionId: 's1', timestamp: 0, lat: 48.0, lng: 11.0 }];
    expect(buildSessionGPS({ sessionId: 's1', records })).toBeNull();
  });

  it('returns null for indoor activities (no GPS)', () => {
    const records = indoorRecordSeries(100);
    expect(buildSessionGPS({ sessionId: 's1', records })).toBeNull();
  });

  it('builds valid SessionGPS for outdoor activity', () => {
    const records = gpsRunningRecordSeries(200);
    const result = buildSessionGPS({ sessionId: 's1', records });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.sessionId).toBe('s1');
    expect(result.encodedPolyline.length).toBeGreaterThan(0);
    expect(result.pointCount).toBeGreaterThan(0);
    expect(result.bounds.minLat).toBeLessThanOrEqual(result.bounds.maxLat);
    expect(result.bounds.minLng).toBeLessThanOrEqual(result.bounds.maxLng);
  });
});

describe(encodedSegmentPolylines.name, () => {
  it('encodes a decodable polyline', () => {
    const polylines = encodedSegmentPolylines(
      routePoints([point(47.0, 11.0), point(47.01, 11.01)]),
    );
    expect(polylines).toHaveLength(1);
    const decoded = decode(polylines[0] ?? '');
    expect(decoded).toHaveLength(2);
    expect(decoded[0]?.[0]).toBeCloseTo(47.0, 4);
    expect(decoded[0]?.[1]).toBeCloseTo(11.0, 4);
  });

  it('encodes one polyline per segment', () => {
    const polylines = encodedSegmentPolylines(
      routePoints([
        point(47.0, 11.0, 0),
        point(47.01, 11.0, 0),
        point(48.0, 12.0, 1),
        point(48.01, 12.0, 1),
      ]),
    );
    expect(polylines).toHaveLength(2);
    const first = decode(polylines[0] ?? '');
    const second = decode(polylines[1] ?? '');
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    expect(first[0]?.[0]).toBeCloseTo(47.0, 4);
    expect(second[0]?.[0]).toBeCloseTo(48.0, 4);
  });

  it('keeps the first and last points', () => {
    const points = Array.from({ length: 20 }, (_, i) =>
      point(48.137 + i * 0.0001, 11.575 + i * 0.0001),
    );
    const decoded = decode(encodedSegmentPolylines(routePoints(points))[0] ?? '');
    const first = decoded[0];
    const last = decoded[decoded.length - 1];
    expect(first?.[0]).toBeCloseTo(48.137, 5);
    expect(first?.[1]).toBeCloseTo(11.575, 5);
    expect(last?.[0]).toBeCloseTo(48.137 + 19 * 0.0001, 5);
    expect(last?.[1]).toBeCloseTo(11.575 + 19 * 0.0001, 5);
  });

  it('removes collinear points', () => {
    const points = Array.from({ length: 100 }, (_, i) =>
      point(48.137 + i * 0.0001, 11.575 + i * 0.0001),
    );
    const decoded = decode(encodedSegmentPolylines(routePoints(points))[0] ?? '');
    expect(decoded.length).toBeLessThan(100);
  });

  it('keeps the corner of a sharp turn', () => {
    const points = [
      point(48.137, 11.575),
      point(48.138, 11.575),
      point(48.139, 11.575),
      point(48.139, 11.576),
      point(48.139, 11.577),
    ];
    const decoded = decode(encodedSegmentPolylines(routePoints(points))[0] ?? '');
    expect(decoded.length).toBeGreaterThanOrEqual(3);
    const corner = decoded.find(
      (pair) => Math.abs(pair[0] - 48.139) < 1e-5 && Math.abs(pair[1] - 11.575) < 1e-5,
    );
    expect(corner).toBeDefined();
  });
});
