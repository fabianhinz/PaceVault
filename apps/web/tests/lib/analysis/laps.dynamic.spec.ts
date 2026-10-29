import { describe, it, expect } from 'vite-plus/test';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { computeDynamicLaps, splitDistanceRange } from '@/lib/analysis/laps.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { runningRecordSeries, cyclingRecordSeries } from '@pacevault/testing/series.ts';

describe(computeDynamicLaps.name, () => {
  it('returns empty for empty records', () => {
    const result = computeDynamicLaps({ records: [], splitDistanceMetres: 1000 });
    expect(result.analysis).toEqual([]);
  });

  it('returns empty for single record', () => {
    const records: SessionRecord[] = [createMockSessionRecord({ timestamp: 0, distance: 0 })];
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis).toEqual([]);
  });

  it('returns empty for records without distance', () => {
    const records: SessionRecord[] = [
      createMockSessionRecord({ timestamp: 0 }),
      createMockSessionRecord({ timestamp: 1 }),
      createMockSessionRecord({ timestamp: 2 }),
    ];
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis).toEqual([]);
  });

  it('produces correct split count for running records with 1km splits', () => {
    const records = runningRecordSeries({ count: 1000 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('produces correct split count for cycling records with 5km splits', () => {
    const records = cyclingRecordSeries({ count: 2000 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 5000 });
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('handles partial final lap', () => {
    const records = runningRecordSeries({ count: 715 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis).toHaveLength(3);
    const lastLap = result.analysis[result.analysis.length - 1];
    expect(lastLap.distance).toBeLessThan(1000);
    expect(lastLap.distance).toBeGreaterThan(0);
  });

  it('returns 1 partial lap when split distance exceeds total distance', () => {
    const records = runningRecordSeries({ count: 100 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis).toHaveLength(1);
    expect(result.analysis[0].distance).toBeLessThan(1000);
  });

  it('computes pace correctly for running', () => {
    const records = runningRecordSeries({ count: 1000 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    result.analysis.forEach((lap) => {
      expect(lap.paceSecPerKm).toBeDefined();
      expect(lap.paceSecPerKm ?? 0).toBeGreaterThan(180);
      expect(lap.paceSecPerKm ?? Infinity).toBeLessThan(500);
    });
  });

  it('all laps have intensity active and interval false', () => {
    const records = runningRecordSeries({ count: 1000 });
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    result.analysis.forEach((lap) => {
      expect(lap.intensity).toBe('active');
      expect(lap.interval).toBe(false);
    });
  });
});

describe('computeDynamicLaps splits', () => {
  const steady = (from: number, seconds: number, startDistance: number): SessionRecord[] =>
    Array.from({ length: seconds }, (_, i) => ({
      timestamp: from + i,
      distance: startDistance + i * 4,
    }));

  it('split pace includes a stop', () => {
    const records: SessionRecord[] = [...steady(0, 126, 0), ...steady(245, 200, 500)];
    const lap = computeDynamicLaps({ records, splitDistanceMetres: 1000 }).analysis[0];
    expect(lap?.distance).toBe(1000);
    expect(lap?.movingTime).toBe(251);
    expect(lap?.paceSecPerKm).toBe(251);
  });

  it('marks only the last split as partial', () => {
    const records = steady(0, 700, 0);
    const result = computeDynamicLaps({ records, splitDistanceMetres: 1000 });
    expect(result.analysis.map((lap) => lap.partial)).toEqual([false, false, true]);
  });

  it('cuts 400 m splits with record spans that share their boundaries', () => {
    const records = steady(0, 301, 0);
    const result = computeDynamicLaps({ records, splitDistanceMetres: 400 });
    expect(result.analysis.map((lap) => lap.distance)).toEqual([400, 400, 400]);
    expect(result.spans).toEqual([
      { lapIndex: 0, startRecord: 0, endRecord: 100 },
      { lapIndex: 1, startRecord: 100, endRecord: 200 },
      { lapIndex: 2, startRecord: 200, endRecord: 300 },
    ]);
  });

  it('0.4 km splits drift long and lose splits over a long ride', () => {
    const records: SessionRecord[] = Array.from({ length: 1104 }, (_, i) => ({
      timestamp: i * 3,
      distance: i * 30,
    }));
    const result = computeDynamicLaps({ records, splitDistanceMetres: 400 });
    expect(result.analysis).toHaveLength(83);
    const full = result.analysis.slice(0, -1).map((lap) => lap.distance ?? 0);
    expect(full.reduce((sum, distance) => sum + distance, 0) / full.length).toBeCloseTo(400, 0);
    expect(result.analysis.at(-1)?.partial).toBe(true);
  });
});

describe(splitDistanceRange.name, () => {
  it('caps the split slider at the session length, never below the sport minimum', () => {
    expect(splitDistanceRange({ sport: 'running', sessionMetres: 42_195 })).toEqual({
      min: 500,
      max: 10_000,
      step: 500,
    });
    expect(splitDistanceRange({ sport: 'running', sessionMetres: 3_240 })).toEqual({
      min: 500,
      max: 3_000,
      step: 500,
    });
    expect(splitDistanceRange({ sport: 'cycling', sessionMetres: 23_700 })).toEqual({
      min: 1000,
      max: 23_000,
      step: 1000,
    });
    expect(splitDistanceRange({ sport: 'cycling', sessionMetres: 400 })).toEqual({
      min: 1000,
      max: 1000,
      step: 1000,
    });
  });
});
