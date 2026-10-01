import { describe, it, expect } from 'vitest';
import { computeDynamicLaps } from '@/lib/dynamicLaps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { makeRunningRecords, makeCyclingRecords } from '@tests/factories/records.ts';

describe('computeDynamicLaps', () => {
  it('returns empty for empty records', () => {
    const result = computeDynamicLaps([], 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('returns empty for single record', () => {
    const records: SessionRecord[] = [{ timestamp: 0, distance: 0 }];
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('returns empty for records without distance', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }, { timestamp: 1 }, { timestamp: 2 }];
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('produces correct split count for running records with 1km splits', () => {
    // ~3.5 m/s for 1000s → ~3500m → 3 full km splits + partial
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    // Total distance ~3500m, so we expect 3 full splits + 1 partial
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('produces correct split count for cycling records with 5km splits', () => {
    // ~8-9 m/s for 2000s → ~16-18km → 3 full 5km splits + partial
    const records = makeCyclingRecords(2000);
    const result = computeDynamicLaps(records, 5000);
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('handles partial final lap', () => {
    // Create records covering ~2500m with 1000m splits → 2 full + 1 partial
    const records = makeRunningRecords(715); // ~715 * 3.5 ≈ 2502m
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis.length).toBe(3);
    // Last lap should be smaller distance
    const lastLap = result.analysis[result.analysis.length - 1];
    expect(lastLap.distance).toBeLessThan(1000);
    expect(lastLap.distance).toBeGreaterThan(0);
  });

  it('returns 1 partial lap when split distance exceeds total distance', () => {
    // ~3.5 m/s for 100s → ~350m, split at 1000m → just 1 partial lap
    const records = makeRunningRecords(100);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toHaveLength(1);
    expect(result.analysis[0].distance).toBeLessThan(1000);
  });

  it('computes pace correctly for running', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    // For running at ~3.5 m/s base, pace ≈ 286 sec/km.
    // Random-walk speed with terrain can produce slower laps on uphills.
    result.analysis.forEach((lap) => {
      expect(lap.paceSecPerKm).toBeDefined();
      expect(lap.paceSecPerKm ?? 0).toBeGreaterThan(180);
      expect(lap.paceSecPerKm ?? Infinity).toBeLessThan(500);
    });
  });

  it('aggregates HR data', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.avgHr).toBeDefined();
      expect(lap.avgHr ?? 0).toBeGreaterThan(100);
      expect(lap.maxHr).toBeDefined();
      expect(lap.maxHr ?? 0).toBeGreaterThanOrEqual(lap.avgHr ?? 0);
    });
  });

  it('computes elevation gain (positive deltas only)', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.elevationGain).toBeGreaterThanOrEqual(0);
    });
  });

  it('produces enrichments with correct lapIndex', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    expect(result.enrichments).toHaveLength(result.analysis.length);
    result.enrichments.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
    });
  });

  it('all laps have intensity active and isInterval false', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.intensity).toBe('active');
      expect(lap.isInterval).toBe(false);
    });
  });

  it('enrichments include minHr from records', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    result.enrichments.forEach((e) => {
      expect(e.minHr).toBeDefined();
      expect(e.minHr ?? 0).toBeGreaterThan(0);
    });
  });

  it('computes maxSpeed from records', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.maxSpeed).toBeDefined();
      expect(lap.maxSpeed ?? 0).toBeGreaterThan(0);
    });
  });

  it('computes avgCadence when cadence data is present', () => {
    const records = makeCyclingRecords(2000);
    const result = computeDynamicLaps(records, 5000);
    result.analysis.forEach((lap) => {
      expect(lap.avgCadence).toBeDefined();
      expect(lap.avgCadence ?? 0).toBeGreaterThan(0);
    });
  });
});
