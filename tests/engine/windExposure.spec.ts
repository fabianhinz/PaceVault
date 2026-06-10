import { describe, it, expect } from 'vitest';
import { computeWindExposure } from '@/packages/engine/windExposure.ts';
import type { WindSample } from '@/packages/engine/windExposure.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { makeIndoorRecords } from '@tests/factories/gps.ts';

// Build a track from a list of longitudes at a fixed latitude, one record per second.
const trackFromLngs = (lngs: number[], lat = 48): SessionRecord[] =>
  lngs.map((lng, i) => ({ sessionId: 's1', timestamp: i, lat, lng }));

// A straight eastbound track (travel bearing ≈ 90°) of `count` points.
const eastTrack = (count: number): SessionRecord[] =>
  trackFromLngs(Array.from({ length: count }, (_, i) => 11 + i * 0.001));

// Single wind observation at the session start.
const windFrom = (direction: number): WindSample[] => [{ time: 0, direction }];

describe('computeWindExposure', () => {
  it('reports 100% headwind when the wind blows from straight ahead', () => {
    // Heading east, wind from the east (90°).
    const result = computeWindExposure(eastTrack(60), windFrom(90), 0);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.headwindPct).toBe(100);
    expect(result.crosswindPct).toBe(0);
    expect(result.tailwindPct).toBe(0);
  });

  it('reports 100% tailwind when the wind blows from directly behind', () => {
    // Heading east, wind from the west (270°).
    const result = computeWindExposure(eastTrack(60), windFrom(270), 0);
    expect(result?.tailwindPct).toBe(100);
    expect(result?.headwindPct).toBe(0);
    expect(result?.crosswindPct).toBe(0);
  });

  it('reports 100% crosswind when the wind blows perpendicular to travel', () => {
    // Heading east, wind from the north (0°).
    const result = computeWindExposure(eastTrack(60), windFrom(0), 0);
    expect(result?.crosswindPct).toBe(100);
    expect(result?.headwindPct).toBe(0);
    expect(result?.tailwindPct).toBe(0);
  });

  it('splits ~50/50 head vs tail on an out-and-back with steady wind', () => {
    // 100 segments east then 100 segments back west, wind steady from the east.
    const east = Array.from({ length: 101 }, (_, i) => 11 + i * 0.001);
    const west = Array.from({ length: 100 }, (_, i) => 11.1 - (i + 1) * 0.001);
    const result = computeWindExposure(trackFromLngs([...east, ...west]), windFrom(90), 0);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.headwindPct).toBe(50);
    expect(result.tailwindPct).toBe(50);
    expect(result.crosswindPct).toBe(0);
  });

  it('always returns three percentages that sum to 100', () => {
    for (const dir of [0, 30, 45, 90, 135, 200, 270, 315]) {
      const result = computeWindExposure(eastTrack(80), windFrom(dir), 0);
      expect(result).not.toBeNull();
      if (!result) continue;
      expect(result.headwindPct + result.crosswindPct + result.tailwindPct).toBe(100);
    }
  });

  it('matches each segment to the nearest-in-time wind sample', () => {
    // Heading east the whole time; wind flips from "from east" (head) to "from west" (tail) mid-session.
    const wind: WindSample[] = [
      { time: 0, direction: 90 },
      { time: 120_000, direction: 270 },
    ];
    const result = computeWindExposure(eastTrack(241), wind, 0);
    expect(result).not.toBeNull();
    if (!result) return;
    // Both buckets must be non-empty — proof that the later sample took over for later segments.
    expect(result.headwindPct).toBeGreaterThan(0);
    expect(result.tailwindPct).toBeGreaterThan(0);
    expect(result.crosswindPct).toBe(0);
    expect(result.headwindPct + result.tailwindPct).toBe(100);
  });

  it('skips long pauses without corrupting the split', () => {
    // Two eastbound moving points, a > 30 s gap, then two more eastbound points; wind from the east.
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, lat: 48, lng: 11.0 },
      { sessionId: 's1', timestamp: 1, lat: 48, lng: 11.001 },
      { sessionId: 's1', timestamp: 1001, lat: 48, lng: 12.0 }, // 1000 s gap → skipped
      { sessionId: 's1', timestamp: 1002, lat: 48, lng: 12.001 },
    ];
    const result = computeWindExposure(records, windFrom(90), 0);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.headwindPct).toBe(100);
    expect(result.movingSeconds).toBe(2); // two 1 s segments; the gap segment excluded
  });

  it('returns null for a stationary track (no real movement)', () => {
    const stationary = trackFromLngs(Array.from({ length: 30 }, () => 11));
    expect(computeWindExposure(stationary, windFrom(90), 0)).toBeNull();
  });

  it('returns null when there is no GPS data', () => {
    expect(computeWindExposure(makeIndoorRecords('s1', 50), windFrom(90), 0)).toBeNull();
  });

  it('returns null when there are no wind samples', () => {
    expect(computeWindExposure(eastTrack(60), [], 0)).toBeNull();
  });

  it('returns null for fewer than two GPS points', () => {
    expect(computeWindExposure(eastTrack(1), windFrom(90), 0)).toBeNull();
  });
});
