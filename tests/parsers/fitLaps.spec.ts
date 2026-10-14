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
    intensity: 'active',
    total_distance: 4631.3,
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
    expect(lap.totalTimerTime).toBe(737);
    expect(lap.totalMovingTime).toBe(739);
    expect(lap.distance).toBe(4631.3);
    expect(lap.minHr).toBe(79);
    expect(lap.maxHr).toBe(130);
    expect(lap.intensity).toBe('active');
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

  it('totalMovingTime is undefined when missing from FIT data', () => {
    const laps = mapFitLaps([makeFitLap({ total_moving_time: undefined })]);
    expect(laps[0].totalMovingTime).toBeUndefined();
  });

  it('leaves distance undefined when total_distance is missing', () => {
    const laps = mapFitLaps([makeFitLap({ total_distance: undefined })]);
    expect(laps[0].distance).toBeUndefined();
  });

  it('maps multiple laps preserving order', () => {
    const fitLaps = [
      makeFitLap({ message_index: { value: 0 } }),
      makeFitLap({ message_index: { value: 1 } }),
      makeFitLap({ message_index: { value: 2 } }),
    ];
    const laps = mapFitLaps(fitLaps);
    expect(laps).toHaveLength(3);
    expect(laps[0].lapIndex).toBe(0);
    expect(laps[1].lapIndex).toBe(1);
    expect(laps[2].lapIndex).toBe(2);
  });
});
