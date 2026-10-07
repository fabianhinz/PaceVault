import { describe, it, expect } from 'vitest';
import { computeDynamicLaps, splitDistanceRange } from '@/lib/dynamicLaps.ts';
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
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('produces correct split count for cycling records with 5km splits', () => {
    const records = makeCyclingRecords(2000);
    const result = computeDynamicLaps(records, 5000);
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('handles partial final lap', () => {
    const records = makeRunningRecords(715);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis.length).toBe(3);
    const lastLap = result.analysis[result.analysis.length - 1];
    expect(lastLap.distance).toBeLessThan(1000);
    expect(lastLap.distance).toBeGreaterThan(0);
  });

  it('returns 1 partial lap when split distance exceeds total distance', () => {
    const records = makeRunningRecords(100);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toHaveLength(1);
    expect(result.analysis[0].distance).toBeLessThan(1000);
  });

  it('computes pace correctly for running', () => {
    const records = makeRunningRecords(1000);
    const result = computeDynamicLaps(records, 1000);
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

describe('computeDynamicLaps with recorded zeros', () => {
  it('counts hr and cadence 0 in the lap averages', () => {
    const records: SessionRecord[] = Array.from({ length: 4 }, (_, i) => ({
      timestamp: i,
      distance: i * 10,
      hr: i % 2 === 0 ? 0 : 160,
      cadence: i % 2 === 0 ? 0 : 90,
    }));
    const lap = computeDynamicLaps(records, 1000).analysis[0];
    expect(lap?.avgHr).toBe(80);
    expect(lap?.avgCadence).toBe(45);
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
    const lap = computeDynamicLaps(records, 1000).analysis[0];
    expect(lap?.distance).toBe(1000);
    expect(lap?.timerTime).toBe(370);
    expect(lap?.movingTime).toBe(251);
    expect(lap?.paceSecPerKm).toBe(251);
  });

  it('marks only the last split as partial', () => {
    const records = steady(0, 700, 0);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis.map((lap) => lap.isPartial)).toEqual([false, false, true]);
  });

  it('cuts 400 m splits with record spans that share their boundaries', () => {
    const records = steady(0, 301, 0);
    const result = computeDynamicLaps(records, 400);
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
    const result = computeDynamicLaps(records, 400);
    expect(result.analysis).toHaveLength(83);
    const full = result.analysis.slice(0, -1).map((lap) => lap.distance ?? 0);
    expect(full.reduce((sum, distance) => sum + distance, 0) / full.length).toBeCloseTo(400, 0);
    expect(result.analysis.at(-1)?.isPartial).toBe(true);
  });
});

describe('splitDistanceRange', () => {
  it('caps the split slider at the session length, never below the sport minimum', () => {
    expect(splitDistanceRange('running', 42_195)).toEqual({ min: 500, max: 10_000, step: 500 });
    expect(splitDistanceRange('running', 3_240)).toEqual({ min: 500, max: 3_000, step: 500 });
    expect(splitDistanceRange('cycling', 23_700)).toEqual({ min: 1000, max: 23_000, step: 1000 });
    expect(splitDistanceRange('cycling', 400)).toEqual({ min: 1000, max: 1000, step: 1000 });
  });
});
