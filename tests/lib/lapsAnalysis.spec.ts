import { describe, it, expect } from 'vite-plus/test';
import { analyzeLaps, detectIntervals } from '@/lib/laps.ts';
import type { SessionLap } from '@/packages/engine/types.ts';

function makeLap(overrides: Partial<SessionLap> = {}): SessionLap {
  return {
    lapIndex: 0,
    startTime: 0,
    endTime: 300_000,
    totalTimerTime: 300,
    distance: 1000,
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
    expect(result[0].paceSecPerKm).toBe(300);
  });

  it('returns undefined pace when distance is 0', () => {
    const laps = [makeLap({ distance: 0 })];
    const result = analyzeLaps(laps);
    expect(result[0].paceSecPerKm).toBeUndefined();
  });

  it('marks intervals when recoveries sit between active laps', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
      makeLap({ lapIndex: 2, intensity: 'active' }),
      makeLap({ lapIndex: 3, intensity: 'rest' }),
      makeLap({ lapIndex: 4, intensity: 'active' }),
    ];
    const result = analyzeLaps(laps);
    expect(result.map((lap) => lap.isInterval)).toEqual([true, false, true, false, true]);
  });

  it('steady run with a trailing recovery lap is not detected as intervals', () => {
    const laps = [
      ...Array.from({ length: 13 }, (_, i) => makeLap({ lapIndex: i, intensity: 'active' })),
      makeLap({ lapIndex: 13, intensity: 'recovery', distance: 683 }),
    ];
    expect(analyzeLaps(laps).some((lap) => lap.isInterval)).toBe(false);
    expect(detectIntervals(laps)).toEqual([]);
  });

  it('a single recovery between two active laps is not an interval session', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'warmup' }),
      makeLap({ lapIndex: 1, intensity: 'active' }),
      makeLap({ lapIndex: 2, intensity: 'rest' }),
      makeLap({ lapIndex: 3, intensity: 'active' }),
      makeLap({ lapIndex: 4, intensity: 'cooldown' }),
    ];
    expect(analyzeLaps(laps).some((lap) => lap.isInterval)).toBe(false);
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
      makeLap({ lapIndex: 4, intensity: 'active', maxHr: 178 }),
      makeLap({ lapIndex: 5, intensity: 'rest', minHr: 140 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(3);
    expect(pairs[0].active.lapIndex).toBe(0);
    expect(pairs[0].recovery?.lapIndex).toBe(1);
    expect(pairs[0].hrDropActiveMaxToRecoveryMin).toBe(40);
    expect(pairs[1].active.lapIndex).toBe(2);
    expect(pairs[1].recovery?.lapIndex).toBe(3);
    expect(pairs[1].hrDropActiveMaxToRecoveryMin).toBe(40);
  });

  it('handles trailing active lap without recovery', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', maxHr: 170 }),
      makeLap({ lapIndex: 1, intensity: 'rest', minHr: 130 }),
      makeLap({ lapIndex: 2, intensity: 'active', maxHr: 175 }),
      makeLap({ lapIndex: 3, intensity: 'rest', minHr: 132 }),
      makeLap({ lapIndex: 4, intensity: 'active', maxHr: 176 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(3);
    expect(pairs[2].recovery).toBeUndefined();
    expect(pairs[2].hrDropActiveMaxToRecoveryMin).toBeUndefined();
  });

  it('handles missing HR data gracefully', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
      makeLap({ lapIndex: 2, intensity: 'active' }),
      makeLap({ lapIndex: 3, intensity: 'rest' }),
      makeLap({ lapIndex: 4, intensity: 'active' }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(3);
    expect(pairs[0].hrDropActiveMaxToRecoveryMin).toBeUndefined();
  });
});
