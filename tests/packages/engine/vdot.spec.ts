import { describe, it, expect } from 'vitest';
import {
  thresholdPaceFromRace,
  calculateVdot,
  predictRaceTime,
  predictRaceTimes,
  RACE_DISTANCE_METERS,
} from '@/packages/engine/vdot.ts';

describe('thresholdPaceFromRace', () => {
  it('5K in 20:00 → threshold pace ~4:10-4:20/km', () => {
    const pace = thresholdPaceFromRace(5000, 20);
    expect(pace).toBeGreaterThanOrEqual(250); // 4:10
    expect(pace).toBeLessThanOrEqual(260); // 4:20
  });

  it('10K in 45:00 → threshold pace ~4:30-4:45/km', () => {
    const pace = thresholdPaceFromRace(10000, 45);
    expect(pace).toBeGreaterThanOrEqual(270); // ~4:30
    expect(pace).toBeLessThanOrEqual(285); // ~4:45
  });

  it('marathon in 3:30:00 → threshold pace ~4:40-4:55/km', () => {
    const pace = thresholdPaceFromRace(42195, 210);
    expect(pace).toBeGreaterThanOrEqual(280); // ~4:40
    expect(pace).toBeLessThanOrEqual(295); // ~4:55
  });

  it('returns an integer (sec/km)', () => {
    const pace = thresholdPaceFromRace(5000, 20);
    expect(Number.isInteger(pace)).toBe(true);
  });

  it('faster race → faster threshold pace', () => {
    const slow = thresholdPaceFromRace(5000, 25);
    const fast = thresholdPaceFromRace(5000, 18);
    expect(fast).toBeLessThan(slow);
  });
});

describe('RACE_DISTANCE_METERS', () => {
  it('maps all standard distances', () => {
    expect(RACE_DISTANCE_METERS['5k']).toBe(5000);
    expect(RACE_DISTANCE_METERS['10k']).toBe(10000);
    expect(RACE_DISTANCE_METERS['half-marathon']).toBe(21097.5);
    expect(RACE_DISTANCE_METERS['marathon']).toBe(42195);
  });
});

describe('calculateVdot', () => {
  it('5K in 20:00 → VDOT ~49-50', () => {
    const vdot = calculateVdot(5000, 20);
    expect(vdot).toBeGreaterThanOrEqual(49);
    expect(vdot).toBeLessThanOrEqual(51);
  });

  it('marathon in 3:00:00 → VDOT ~53-54', () => {
    const vdot = calculateVdot(42195, 180);
    expect(vdot).toBeGreaterThanOrEqual(53);
    expect(vdot).toBeLessThanOrEqual(55);
  });

  it('higher fitness → higher VDOT', () => {
    const slow = calculateVdot(5000, 25);
    const fast = calculateVdot(5000, 18);
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('predictRaceTime', () => {
  it('20:00 5K → 10K prediction ~41-42 min', () => {
    const vdot = calculateVdot(5000, 20);
    const time = predictRaceTime(vdot, 10000);
    expect(time).toBeDefined();
    // With VDOT ~49.8, 10K should be roughly 41-42 minutes
    expect(time ?? 0).toBeGreaterThanOrEqual(41 * 60);
    expect(time ?? Infinity).toBeLessThanOrEqual(42 * 60 + 30);
  });

  it('round-trips: predicting the input distance recovers the input time', () => {
    const vdot = calculateVdot(5000, 20);
    const time = predictRaceTime(vdot, 5000);
    expect(time).toBeDefined();
    expect((time ?? 0) / 60).toBeCloseTo(20, 1);
  });

  it('returns undefined for invalid inputs', () => {
    expect(predictRaceTime(0, 5000)).toBeUndefined();
    expect(predictRaceTime(42, 0)).toBeUndefined();
    expect(predictRaceTime(-1, 5000)).toBeUndefined();
  });

  it('longer distances produce longer times', () => {
    const vdot = calculateVdot(5000, 20);
    const t5k = predictRaceTime(vdot, 5000);
    const t10k = predictRaceTime(vdot, 10000);
    const tHalf = predictRaceTime(vdot, 21097.5);
    const tMarathon = predictRaceTime(vdot, 42195);
    if (t5k == null || t10k == null || tHalf == null || tMarathon == null) {
      return expect(t5k && t10k && tHalf && tMarathon).toBeDefined();
    }
    expect(t10k).toBeGreaterThan(t5k);
    expect(tHalf).toBeGreaterThan(t10k);
    expect(tMarathon).toBeGreaterThan(tHalf);
  });
});

describe('predictRaceTimes', () => {
  it('returns predictions for all 4 standard distances', () => {
    const result = predictRaceTimes(5000, 20 * 60);
    expect(result).toBeDefined();
    expect(result?.['5k']).toBeDefined();
    expect(result?.['10k']).toBeDefined();
    expect(result?.['half-marathon']).toBeDefined();
    expect(result?.['marathon']).toBeDefined();
  });

  it('5K input time matches the 5K prediction', () => {
    const result = predictRaceTimes(5000, 20 * 60);
    expect(result?.['5k'].timeSeconds).toBeCloseTo(20 * 60, 0);
  });

  it('each prediction includes pace in sec/km', () => {
    const result = predictRaceTimes(5000, 20 * 60);
    // 5K pace: 1200s / 5km = 240 sec/km
    expect(result?.['5k'].paceSecPerKm).toBeCloseTo(240, 0);
  });

  it('returns undefined for degenerate input', () => {
    expect(predictRaceTimes(0, 1200)).toBeUndefined();
  });
});
