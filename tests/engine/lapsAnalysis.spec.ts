import { describe, it, expect } from 'vitest';
import {
  analyzeLaps,
  detectIntervals,
  detectProgressiveOverload,
  filterRecordsByLap,
  enrichLapFromRecords,
  enrichAllLaps,
  findLapIndexAtCoordinate,
  findDynamicLapIndexAtCoordinate,
} from '@/lib/laps.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';
import { makeLaps, makeCyclingRecords, makeRunningRecords } from '@tests/factories/records.ts';

function makeLap(overrides: Partial<SessionLap> = {}): SessionLap {
  return {
    lapIndex: 0,
    startTime: 0,
    endTime: 300_000,
    totalElapsedTime: 300,
    totalTimerTime: 300,
    distance: 1000,
    avgSpeed: 3.33,
    intensity: 'active',
    ...overrides,
  };
}

describe('analyzeLaps', () => {
  it('returns empty array for empty input', () => {
    expect(analyzeLaps([])).toEqual([]);
  });

  it('computes pace from distance and duration', () => {
    const laps = [makeLap({ distance: 1000, totalTimerTime: 300 })];
    const result = analyzeLaps(laps);
    expect(result).toHaveLength(1);
    // 300s / 1km = 300 sec/km
    expect(result[0].paceSecPerKm).toBe(300);
  });

  it('returns undefined pace when distance is 0', () => {
    const laps = [makeLap({ distance: 0 })];
    const result = analyzeLaps(laps);
    expect(result[0].paceSecPerKm).toBeUndefined();
  });

  it('marks intervals only when there are mixed intensities', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
      makeLap({ lapIndex: 2, intensity: 'active' }),
    ];
    const result = analyzeLaps(laps);
    expect(result[0].isInterval).toBe(true);
    expect(result[1].isInterval).toBe(false);
    expect(result[2].isInterval).toBe(true);
  });

  it('all-active laps are not intervals (steady state)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'active' }),
    ];
    const result = analyzeLaps(laps);
    expect(result[0].isInterval).toBe(false);
    expect(result[1].isInterval).toBe(false);
  });

  it('uses movingTime for pace when available', () => {
    const laps = [makeLap({ distance: 1000, totalTimerTime: 300, totalMovingTime: 280 })];
    const result = analyzeLaps(laps);
    // 280s / 1km = 280 sec/km
    expect(result[0].paceSecPerKm).toBe(280);
  });
});

describe('detectIntervals', () => {
  it('returns empty for all-active laps (steady state)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'active' }),
    ];
    expect(detectIntervals(laps)).toEqual([]);
  });

  it('pairs active laps with following recovery laps', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', maxHr: 170 }),
      makeLap({ lapIndex: 1, intensity: 'rest', minHr: 130 }),
      makeLap({ lapIndex: 2, intensity: 'active', maxHr: 175 }),
      makeLap({ lapIndex: 3, intensity: 'rest', minHr: 135 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].active.lapIndex).toBe(0);
    expect(pairs[0].recovery?.lapIndex).toBe(1);
    expect(pairs[0].hrRecovery).toBe(40); // 170 - 130
    expect(pairs[1].active.lapIndex).toBe(2);
    expect(pairs[1].recovery?.lapIndex).toBe(3);
    expect(pairs[1].hrRecovery).toBe(40); // 175 - 135
  });

  it('handles trailing active lap without recovery', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', maxHr: 170 }),
      makeLap({ lapIndex: 1, intensity: 'rest', minHr: 130 }),
      makeLap({ lapIndex: 2, intensity: 'active', maxHr: 175 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(2);
    expect(pairs[1].recovery).toBeUndefined();
    expect(pairs[1].hrRecovery).toBeUndefined();
  });

  it('handles missing HR data gracefully', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].hrRecovery).toBeUndefined();
  });
});

describe('detectProgressiveOverload', () => {
  it('returns stable with single lap', () => {
    const result = detectProgressiveOverload([makeLap()]);
    expect(result.trend).toBe('stable');
    expect(result.lapCount).toBe(1);
    expect(result.paceDriftPercent).toBeUndefined();
  });

  it('detects fading: pace slowing across intervals', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 162,
      }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 4,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 360,
        avgHr: 168,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('fading');
    expect(result.lapCount).toBe(3);
    expect(result.paceDriftPercent).toBeDefined();
    expect(result.paceDriftPercent ?? 0).toBeGreaterThan(3);
  });

  it('detects stable: minimal drift', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 303,
        avgHr: 156,
      }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 4,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 302,
        avgHr: 157,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('stable');
  });

  it('detects building: pace improving (negative drift)', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 162,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('building');
    expect(result.paceDriftPercent ?? 0).toBeLessThan(-3);
  });

  it('uses all laps when no intervals detected (steady state)', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 150,
      }),
      makeLap({
        lapIndex: 1,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 158,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.lapCount).toBe(2);
    expect(result.paceDriftPercent).toBeDefined();
  });
});

describe('filterRecordsByLap', () => {
  it('returns records within lap bounds', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    const records: SessionRecord[] = [
      { timestamp: 0 },
      { timestamp: 150 },
      { timestamp: 299 },
      { timestamp: 300 }, // excluded (endTime boundary)
      { timestamp: 500 },
    ];
    const result = filterRecordsByLap(records, lap, 0);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.timestamp)).toEqual([0, 150, 299]);
  });

  it('handles non-zero session start (ms-to-seconds conversion)', () => {
    const sessionStartMs = 1_000_000;
    const lap = makeLap({
      startTime: sessionStartMs + 300_000,
      endTime: sessionStartMs + 600_000,
    });
    const records: SessionRecord[] = [
      { timestamp: 200 },
      { timestamp: 300 }, // lap start
      { timestamp: 450 },
      { timestamp: 599 },
      { timestamp: 600 }, // excluded
    ];
    const result = filterRecordsByLap(records, lap, sessionStartMs);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.timestamp)).toEqual([300, 450, 599]);
  });

  it('returns empty for empty records', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    expect(filterRecordsByLap([], lap, 0)).toHaveLength(0);
  });

  it('returns empty when no records fall within the lap', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    const records: SessionRecord[] = [{ timestamp: 400 }, { timestamp: 500 }];
    expect(filterRecordsByLap(records, lap, 0)).toHaveLength(0);
  });
});

describe('enrichLapFromRecords', () => {
  it('computes power metrics from cycling records', () => {
    const records = makeCyclingRecords(100);
    const result = enrichLapFromRecords(0, records);
    expect(result.lapIndex).toBe(0);
    expect(result.avgPower).toBeDefined();
    expect(result.minPower).toBeDefined();
    expect(result.maxPower).toBeDefined();
    expect(result.minPower ?? 0).toBeLessThanOrEqual(result.avgPower ?? 0);
    expect(result.maxPower ?? 0).toBeGreaterThanOrEqual(result.avgPower ?? 0);
  });

  it('computes minSpeed from running records', () => {
    const records = makeRunningRecords(100);
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeDefined();
    expect(result.minSpeed ?? 0).toBeGreaterThan(0);
    // running records don't have power
    expect(result.avgPower).toBeUndefined();
  });

  it('returns undefined fields when data is absent', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }, { timestamp: 1 }];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeUndefined();
    expect(result.avgPower).toBeUndefined();
    expect(result.minPower).toBeUndefined();
    expect(result.maxPower).toBeUndefined();
    expect(result.minCadence).toBeUndefined();
    expect(result.minHr).toBeUndefined();
  });

  it('excludes zero-speed records from minSpeed', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0 },
      { timestamp: 1, speed: 3.5 },
      { timestamp: 2, speed: 4.0 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBe(3.5);
  });

  it('excludes near-zero speeds below MIN_SPEED_MS threshold', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0.01 },
      { timestamp: 1, speed: 0.3 },
      { timestamp: 2, speed: 2.5 },
      { timestamp: 3, speed: 3.0 },
    ];
    const result = enrichLapFromRecords(0, records);
    // speeds 0.01 and 0.3 are below 0.5 m/s threshold
    expect(result.minSpeed).toBe(2.5);
  });

  it('returns undefined minSpeed when all speeds are below threshold', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0.1 },
      { timestamp: 1, speed: 0.2 },
      { timestamp: 2, speed: 0.4 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeUndefined();
  });

  it('computes minHr from per-second records', () => {
    const records: SessionRecord[] = Array.from({ length: 20 }, (_, i) => ({
      sessionId: 'test',
      timestamp: i,
      hr: 130 + i,
    }));
    const result = enrichLapFromRecords(0, records);
    expect(result.minHr).toBeDefined();
    expect(result.minHr).toBe(130);
  });

  it('returns true minimum for power (zero excluded by pre-filter)', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, power: 0 },
      ...Array.from({ length: 19 }, (_, i) => ({
        sessionId: 'test',
        timestamp: i + 1,
        power: 180 + i * 2,
      })),
    ];
    const result = enrichLapFromRecords(0, records);
    // The 0W record is excluded by the > 0 filter; true min is 180
    expect(result.minPower).toBe(180);
  });

  it('returns true minimum HR including outliers', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, hr: 50 }, // sensor glitch — now included as true min
      ...Array.from({ length: 20 }, (_, i) => ({
        sessionId: 'test',
        timestamp: i + 1,
        hr: 140 + i,
      })),
    ];
    const result = enrichLapFromRecords(0, records);
    // sorted: [50, 140, 141, ..., 159] — true min is 50
    expect(result.minHr).toBe(50);
  });

  it('excludes zero-power coasting from minPower', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, power: 0 },
      { timestamp: 1, power: 0 },
      { timestamp: 2, power: 150 },
      { timestamp: 3, power: 200 },
      { timestamp: 4, power: 180 },
    ];
    const result = enrichLapFromRecords(0, records);
    // Zero-power records filtered out; remaining: [150, 180, 200]
    expect(result.minPower).toBe(150);
  });

  it('excludes zero-cadence from minCadence', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, cadence: 0 },
      { timestamp: 1, cadence: 70 },
      { timestamp: 2, cadence: 80 },
      { timestamp: 3, cadence: 85 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minCadence).toBe(70);
  });
});

describe('enrichAllLaps', () => {
  it('enriches each lap with correct record slice (cycling)', () => {
    const laps = makeLaps(5);
    // makeLaps: 300s per lap → total 1500s. Generate matching records.
    const records = makeCyclingRecords(1500);
    const result = enrichAllLaps(laps, records);
    expect(result).toHaveLength(5);
    result.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
      expect(e.avgPower).toBeDefined();
    });
  });

  it('enriches each lap with correct record slice (running)', () => {
    const laps = makeLaps(5);
    const records = makeRunningRecords(1500);
    const result = enrichAllLaps(laps, records);
    expect(result).toHaveLength(5);
    result.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
      expect(e.minSpeed).toBeDefined();
      expect(e.avgPower).toBeUndefined();
    });
  });

  it('returns empty for empty laps', () => {
    const records = makeCyclingRecords(100);
    expect(enrichAllLaps([], records)).toHaveLength(0);
  });

  it('returns empty for empty records', () => {
    const laps = makeLaps(3);
    expect(enrichAllLaps(laps, [])).toHaveLength(0);
  });
});

describe('findLapIndexAtCoordinate', () => {
  const baseLaps: SessionLap[] = [
    makeLap({ lapIndex: 0, startTime: 0, endTime: 300_000 }),
    makeLap({ lapIndex: 1, startTime: 300_000, endTime: 600_000 }),
    makeLap({ lapIndex: 2, startTime: 600_000, endTime: 900_000 }),
  ];

  const makeGpsRecord = (timestamp: number, lat: number, lng: number): SessionRecord => ({
    timestamp,
    lat,
    lng,
  });

  it('returns undefined for empty laps', () => {
    const records = [makeGpsRecord(10, 48.0, 11.0)];
    expect(findLapIndexAtCoordinate([11.0, 48.0], records, [])).toBeUndefined();
  });

  it('returns undefined for empty records', () => {
    expect(findLapIndexAtCoordinate([11.0, 48.0], [], baseLaps)).toBeUndefined();
  });

  it('returns undefined when records have no GPS data', () => {
    const records: SessionRecord[] = [{ timestamp: 10 }, { timestamp: 100 }];
    expect(findLapIndexAtCoordinate([11.0, 48.0], records, baseLaps)).toBeUndefined();
  });

  it('finds the correct lap for a coordinate near a record in lap 0', () => {
    const records = [
      makeGpsRecord(50, 48.1, 11.1), // lap 0 (0–300s)
      makeGpsRecord(350, 48.2, 11.2), // lap 1 (300–600s)
      makeGpsRecord(650, 48.3, 11.3), // lap 2 (600–900s)
    ];
    // Click near first record
    expect(findLapIndexAtCoordinate([11.1001, 48.1001], records, baseLaps)).toBe(0);
  });

  it('finds the correct lap for a coordinate near a record in lap 1', () => {
    const records = [
      makeGpsRecord(50, 48.1, 11.1),
      makeGpsRecord(350, 48.2, 11.2),
      makeGpsRecord(650, 48.3, 11.3),
    ];
    expect(findLapIndexAtCoordinate([11.2001, 48.2001], records, baseLaps)).toBe(1);
  });

  it('returns last lap index as fallback when record exceeds lap bounds', () => {
    const records = [makeGpsRecord(950, 48.1, 11.1)]; // beyond all lap end times
    expect(findLapIndexAtCoordinate([11.1, 48.1], records, baseLaps)).toBe(2);
  });
});

describe('findDynamicLapIndexAtCoordinate', () => {
  const makeDistRecord = (
    timestamp: number,
    lat: number,
    lng: number,
    distance: number,
  ): SessionRecord => ({
    timestamp,
    lat,
    lng,
    distance,
  });

  it('returns undefined for empty records', () => {
    expect(findDynamicLapIndexAtCoordinate([11.0, 48.0], [], 1000, 3)).toBeUndefined();
  });

  it('returns undefined for zero split distance', () => {
    const records = [makeDistRecord(10, 48.0, 11.0, 500)];
    expect(findDynamicLapIndexAtCoordinate([11.0, 48.0], records, 0, 3)).toBeUndefined();
  });

  it('returns undefined when closest record has no distance', () => {
    const records: SessionRecord[] = [{ timestamp: 10, lat: 48.0, lng: 11.0 }];
    expect(findDynamicLapIndexAtCoordinate([11.0, 48.0], records, 1000, 3)).toBeUndefined();
  });

  it('maps coordinate to correct dynamic lap by distance', () => {
    const records = [
      makeDistRecord(0, 48.1, 11.1, 0),
      makeDistRecord(100, 48.2, 11.2, 500),
      makeDistRecord(200, 48.3, 11.3, 1200), // lap 1 (1000–2000m)
      makeDistRecord(300, 48.4, 11.4, 2500), // lap 2 (2000–3000m)
    ];
    // Click near record at 1200m → should be lap 1
    expect(findDynamicLapIndexAtCoordinate([11.3001, 48.3001], records, 1000, 3)).toBe(1);
  });

  it('clamps to last lap when distance exceeds total', () => {
    const records = [makeDistRecord(0, 48.1, 11.1, 0), makeDistRecord(100, 48.2, 11.2, 5000)];
    // 5000m with 1000m splits → index 5, but only 3 laps → clamp to 2
    expect(findDynamicLapIndexAtCoordinate([11.2, 48.2], records, 1000, 3)).toBe(2);
  });

  it('returns lap 0 for record at the start', () => {
    const records = [makeDistRecord(0, 48.1, 11.1, 0)];
    expect(findDynamicLapIndexAtCoordinate([11.1, 48.1], records, 1000, 5)).toBe(0);
  });
});
