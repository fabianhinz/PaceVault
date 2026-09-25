import { describe, it, expect } from 'vitest';
import { mapFitLaps } from '@/parsers/fit.ts';

function makeFitLap(overrides: Record<string, unknown> = {}) {
  return {
    start_time: '2025-08-16T16:14:27.000Z',
    timestamp: '2025-08-16T16:26:44.000Z',
    message_index: { value: 0 },
    total_elapsed_time: 737,
    total_timer_time: 737,
    total_moving_time: 739,
    repetition_num: 1,
    intensity: 'active',
    total_distance: 4631.3,
    avg_speed: 6.267,
    max_speed: 8.35,
    total_ascent: 27,
    min_altitude: 116,
    max_altitude: 126.8,
    avg_grade: 0,
    avg_heart_rate: 113,
    min_heart_rate: 79,
    max_heart_rate: 130,
    ...overrides,
  };
}

describe('mapFitLaps', () => {
  it('returns empty array for empty input', () => {
    expect(mapFitLaps([])).toEqual([]);
  });

  it('maps cycling lap fields correctly (no cadence)', () => {
    const laps = mapFitLaps([makeFitLap()]);
    expect(laps).toHaveLength(1);
    const lap = laps[0];
    expect(lap.lapIndex).toBe(0);
    expect(lap.startTime).toBe(new Date('2025-08-16T16:14:27.000Z').getTime());
    expect(lap.endTime).toBe(new Date('2025-08-16T16:26:44.000Z').getTime());
    expect(lap.totalElapsedTime).toBe(737);
    expect(lap.totalTimerTime).toBe(737);
    expect(lap.totalMovingTime).toBe(739);
    expect(lap.distance).toBe(4631.3);
    expect(lap.avgSpeed).toBe(6.267);
    expect(lap.maxSpeed).toBe(8.35);
    expect(lap.totalAscent).toBe(27);
    expect(lap.avgHr).toBe(113);
    expect(lap.minHr).toBe(79);
    expect(lap.maxHr).toBe(130);
    expect(lap.avgCadence).toBeUndefined();
    expect(lap.maxCadence).toBeUndefined();
    expect(lap.intensity).toBe('active');
    expect(lap.repetitionNum).toBe(1);
  });

  it('maps running lap fields correctly (with cadence)', () => {
    const laps = mapFitLaps([makeFitLap({ avg_cadence: 83, max_cadence: 88 })]);
    expect(laps[0].avgCadence).toBe(83);
    expect(laps[0].maxCadence).toBe(88);
  });

  it('uses array index as fallback when message_index is missing', () => {
    const laps = mapFitLaps([
      makeFitLap({ message_index: undefined }),
      makeFitLap({ message_index: undefined }),
    ]);
    expect(laps[0].lapIndex).toBe(0);
    expect(laps[1].lapIndex).toBe(1);
  });

  it('startTime and endTime are epoch milliseconds', () => {
    const laps = mapFitLaps([makeFitLap()]);
    expect(typeof laps[0].startTime).toBe('number');
    expect(typeof laps[0].endTime).toBe('number');
    expect(laps[0].startTime).toBeGreaterThan(1e12);
    expect(laps[0].endTime).toBeGreaterThan(laps[0].startTime);
  });

  it('derives endTime from elapsed time when the timestamp is not after the start', () => {
    const laps = mapFitLaps([
      makeFitLap({
        start_time: '2026-09-11T16:22:29.000Z',
        timestamp: '2026-09-11T16:11:14.000Z',
        total_elapsed_time: 607.184,
      }),
      makeFitLap({
        start_time: '2026-09-11T16:11:14.000Z',
        timestamp: '2026-09-11T16:11:14.000Z',
        total_elapsed_time: 674.653,
      }),
    ]);
    expect(laps[0].endTime).toBe(new Date('2026-09-11T16:22:29.000Z').getTime() + 607184);
    expect(laps[1].endTime).toBe(new Date('2026-09-11T16:11:14.000Z').getTime() + 674653);
  });

  it('derives endTime from elapsed time when the timestamp is missing', () => {
    const laps = mapFitLaps([makeFitLap({ timestamp: undefined })]);
    expect(laps[0].endTime).toBe(new Date('2025-08-16T16:14:27.000Z').getTime() + 737000);
  });

  it('keeps a valid timestamp even when it disagrees with elapsed time', () => {
    const laps = mapFitLaps([makeFitLap({ total_elapsed_time: 100 })]);
    expect(laps[0].endTime).toBe(new Date('2025-08-16T16:26:44.000Z').getTime());
  });

  it('leaves endTime at 0 when neither timestamp nor elapsed time is usable', () => {
    const laps = mapFitLaps([makeFitLap({ timestamp: undefined, total_elapsed_time: undefined })]);
    expect(laps[0].endTime).toBe(0);
  });

  it('totalMovingTime is undefined when missing from FIT data', () => {
    const laps = mapFitLaps([makeFitLap({ total_moving_time: undefined })]);
    expect(laps[0].totalMovingTime).toBeUndefined();
  });

  it('handles missing total_distance gracefully', () => {
    const laps = mapFitLaps([makeFitLap({ total_distance: undefined })]);
    expect(laps[0].distance).toBe(0);
  });

  it('prefers enhanced fields over legacy when both are present', () => {
    const laps = mapFitLaps([
      makeFitLap({
        avg_speed: 6.0,
        enhanced_avg_speed: 6.267,
        max_speed: 8.0,
        enhanced_max_speed: 8.35,
        min_altitude: 100,
        enhanced_min_altitude: 100.4,
        max_altitude: 120,
        enhanced_max_altitude: 120.8,
        avg_altitude: 110,
        enhanced_avg_altitude: 110.6,
      }),
    ]);
    expect(laps[0].avgSpeed).toBe(6.267);
    expect(laps[0].maxSpeed).toBe(8.35);
    expect(laps[0].minAltitude).toBe(100.4);
    expect(laps[0].maxAltitude).toBe(120.8);
    expect(laps[0].avgAltitude).toBe(110.6);
  });

  it('falls back to legacy fields when enhanced are missing', () => {
    const laps = mapFitLaps([
      makeFitLap({
        avg_speed: 6.0,
        max_speed: 8.0,
        min_altitude: 100,
        max_altitude: 120,
        avg_altitude: 110,
      }),
    ]);
    expect(laps[0].avgSpeed).toBe(6.0);
    expect(laps[0].maxSpeed).toBe(8.0);
    expect(laps[0].minAltitude).toBe(100);
    expect(laps[0].maxAltitude).toBe(120);
    expect(laps[0].avgAltitude).toBe(110);
  });

  it('maps multiple laps preserving order', () => {
    const fitLaps = [
      makeFitLap({ message_index: { value: 0 }, repetition_num: 1 }),
      makeFitLap({ message_index: { value: 1 }, repetition_num: 2 }),
      makeFitLap({ message_index: { value: 2 }, repetition_num: 3 }),
    ];
    const laps = mapFitLaps(fitLaps);
    expect(laps).toHaveLength(3);
    expect(laps[0].lapIndex).toBe(0);
    expect(laps[1].lapIndex).toBe(1);
    expect(laps[2].lapIndex).toBe(2);
    expect(laps[0].repetitionNum).toBe(1);
    expect(laps[2].repetitionNum).toBe(3);
  });
});

describe('movingTime derivation (via laps)', () => {
  it('sums totalMovingTime from all laps', () => {
    const laps = mapFitLaps([
      makeFitLap({ total_moving_time: 300 }),
      makeFitLap({ total_moving_time: 400 }),
    ]);
    const movingTime = laps.reduce(
      (sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime),
      0,
    );
    expect(movingTime).toBe(700);
  });

  it('falls back to totalTimerTime when totalMovingTime is missing', () => {
    const laps = mapFitLaps([
      makeFitLap({ total_moving_time: undefined, total_timer_time: 500 }),
      makeFitLap({ total_moving_time: 300 }),
    ]);
    const movingTime = laps.reduce(
      (sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime),
      0,
    );
    expect(movingTime).toBe(800);
  });
});
