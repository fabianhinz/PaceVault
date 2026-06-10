import { describe, it, expect } from 'vitest';
import {
  extractPathFromRecords,
  buildSessionGPS,
  boundsOverlap,
  densestClusterBounds,
  bearingDeg,
} from '@/packages/engine/gps.ts';
import { makeGPSRunningRecords, makeIndoorRecords } from '@tests/factories/gps.ts';

describe('bearingDeg', () => {
  const origin = { lat: 0, lng: 0 };

  it('points north as 0°', () => {
    expect(bearingDeg(origin, { lat: 1, lng: 0 })).toBeCloseTo(0, 1);
  });

  it('points east as 90°', () => {
    expect(bearingDeg(origin, { lat: 0, lng: 1 })).toBeCloseTo(90, 1);
  });

  it('points south as 180°', () => {
    expect(bearingDeg(origin, { lat: -1, lng: 0 })).toBeCloseTo(180, 1);
  });

  it('points west as 270°', () => {
    expect(bearingDeg(origin, { lat: 0, lng: -1 })).toBeCloseTo(270, 1);
  });

  it('points northeast as ~45° near the equator', () => {
    expect(bearingDeg(origin, { lat: 1, lng: 1 })).toBeCloseTo(45, 0);
  });

  it('always returns a value within [0, 360)', () => {
    const b = bearingDeg({ lat: 48, lng: 11 }, { lat: 47.9, lng: 10.9 });
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('extractPathFromRecords', () => {
  it('extracts [lng, lat] pairs from records with valid GPS', () => {
    const records = makeGPSRunningRecords('s1', 10);
    const path = extractPathFromRecords(records);
    expect(path).toHaveLength(10);
    // Output is [lng, lat] — same convention as decodeTrackForRendering
    expect(path[0][0]).toBeCloseTo(11.575, 3); // lng
    expect(path[0][1]).toBeCloseTo(48.137, 3); // lat
  });

  it('returns empty array for indoor sessions', () => {
    const records = makeIndoorRecords('s1', 50);
    const path = extractPathFromRecords(records);
    expect(path).toHaveLength(0);
  });

  it('filters out null and out-of-range coordinates', () => {
    const records = [
      { sessionId: 's1', timestamp: 0, lat: 48.0, lng: 11.0 },
      { sessionId: 's1', timestamp: 1, lat: undefined, lng: 11.0 },
      { sessionId: 's1', timestamp: 2, lat: 48.0, lng: undefined },
      { sessionId: 's1', timestamp: 3, lat: 91, lng: 11.0 },
      { sessionId: 's1', timestamp: 4, lat: 48.0, lng: -181 },
      { sessionId: 's1', timestamp: 5, lat: 49.0, lng: 12.0 },
    ];
    const path = extractPathFromRecords(records);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual([11.0, 48.0]);
    expect(path[1]).toEqual([12.0, 49.0]);
  });

  it('preserves all points without simplification', () => {
    const records = makeGPSRunningRecords('s1', 500);
    const path = extractPathFromRecords(records);
    expect(path).toHaveLength(500);
  });

  it('outputs [lng, lat] matching decodeTrackForRendering convention', () => {
    const records = [{ sessionId: 's1', timestamp: 0, lat: 48.137, lng: 11.575 }];
    const path = extractPathFromRecords(records);
    // Output is [lng, lat]
    expect(path[0][0]).toBeCloseTo(11.575, 4);
    expect(path[0][1]).toBeCloseTo(48.137, 4);
  });
});

describe('buildSessionGPS', () => {
  it('returns null for < 2 GPS points', () => {
    const records = [{ sessionId: 's1', timestamp: 0, lat: 48.0, lng: 11.0 }];
    expect(buildSessionGPS('s1', records)).toBeNull();
  });

  it('returns null for indoor activities (no GPS)', () => {
    const records = makeIndoorRecords('s1', 100);
    expect(buildSessionGPS('s1', records)).toBeNull();
  });

  it('builds valid SessionGPS for outdoor activity', () => {
    const records = makeGPSRunningRecords('s1', 200);
    const result = buildSessionGPS('s1', records);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.sessionId).toBe('s1');
    expect(result.encodedPolyline.length).toBeGreaterThan(0);
    expect(result.pointCount).toBeGreaterThan(0);
    expect(result.bounds.minLat).toBeLessThanOrEqual(result.bounds.maxLat);
    expect(result.bounds.minLng).toBeLessThanOrEqual(result.bounds.maxLng);
  });
});

describe('boundsOverlap', () => {
  it('returns true for overlapping boxes', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.3, maxLat: 48.8, minLng: 11.3, maxLng: 11.8 };
    expect(boundsOverlap(a, b)).toBe(true);
  });

  it('returns false for disjoint boxes', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 50.0, maxLat: 50.5, minLng: 13.0, maxLng: 13.5 };
    expect(boundsOverlap(a, b)).toBe(false);
  });

  it('returns true for touching edges', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.5, maxLat: 49.0, minLng: 11.5, maxLng: 12.0 };
    expect(boundsOverlap(a, b)).toBe(true);
  });
});

describe('densestClusterBounds', () => {
  it('returns null for empty array', () => {
    expect(densestClusterBounds([])).toBeNull();
  });

  it('returns single bounds unchanged', () => {
    const b = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    expect(densestClusterBounds([b])).toEqual(b);
  });

  it('picks the dense cluster over an outlier', () => {
    // 3 overlapping tracks in Munich
    const munich1 = { minLat: 48.0, maxLat: 48.2, minLng: 11.4, maxLng: 11.6 };
    const munich2 = { minLat: 48.1, maxLat: 48.3, minLng: 11.5, maxLng: 11.7 };
    const munich3 = { minLat: 48.05, maxLat: 48.25, minLng: 11.45, maxLng: 11.65 };
    // 1 outlier in Berlin
    const berlin = { minLat: 52.4, maxLat: 52.6, minLng: 13.3, maxLng: 13.5 };

    const result = densestClusterBounds([munich1, munich2, munich3, berlin]);
    expect(result).not.toBeNull();
    // Result should cover Munich, not Berlin
    expect(result?.maxLat).toBeLessThan(49);
    expect(result?.minLng).toBeGreaterThan(11);
  });

  it('returns union of all when everything overlaps', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.2, maxLat: 48.7, minLng: 11.2, maxLng: 11.7 };
    const result = densestClusterBounds([a, b]);
    expect(result).toEqual({ minLat: 48.0, maxLat: 48.7, minLng: 11.0, maxLng: 11.7 });
  });

  it('large bounding box should NOT win over a cluster of small tracks', () => {
    // 5 short runs in Munich (centers cluster tightly around 48.14, 11.57)
    const munichRun1 = { minLat: 48.12, maxLat: 48.15, minLng: 11.55, maxLng: 11.58 };
    const munichRun2 = { minLat: 48.13, maxLat: 48.16, minLng: 11.56, maxLng: 11.59 };
    const munichRun3 = { minLat: 48.11, maxLat: 48.14, minLng: 11.54, maxLng: 11.57 };
    const munichRun4 = { minLat: 48.14, maxLat: 48.17, minLng: 11.57, maxLng: 11.6 };
    const munichRun5 = { minLat: 48.1, maxLat: 48.13, minLng: 11.53, maxLng: 11.56 };
    // 1 long bike ride Munich → Alps (center ≈ 47.6, 11.7 — outside radius of Munich cluster)
    const alpsBikeRide = { minLat: 47.0, maxLat: 48.2, minLng: 11.0, maxLng: 12.4 };

    const result = densestClusterBounds([
      munichRun1,
      munichRun2,
      munichRun3,
      munichRun4,
      munichRun5,
      alpsBikeRide,
    ]);

    expect(result).not.toBeNull();
    // Viewport should cover Munich, not stretch to the Alps
    expect(result?.minLat).toBeGreaterThan(48.0);
    expect(result?.maxLat).toBeLessThan(48.5);
    expect(result?.minLng).toBeGreaterThan(11.4);
    expect(result?.maxLng).toBeLessThan(11.7);
  });
});
