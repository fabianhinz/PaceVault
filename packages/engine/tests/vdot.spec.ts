import { describe, it, expect } from 'vite-plus/test';
import {
  thresholdPaceFromRace,
  vdotFromRace,
  predictRaceTime,
  predictRaceTimes,
  METERS_BY_RACE_DISTANCE,
} from '../src/vdot.ts';

describe('vdot', () => {
  describe(thresholdPaceFromRace.name, () => {
    it('5K in 20:00 → threshold pace ~4:10-4:20/km', () => {
      const pace = thresholdPaceFromRace({ distanceMeters: 5000, timeMin: 20 });
      expect(pace).toBeGreaterThanOrEqual(250);
      expect(pace).toBeLessThanOrEqual(260);
    });

    it('10K in 45:00 → threshold pace ~4:30-4:45/km', () => {
      const pace = thresholdPaceFromRace({ distanceMeters: 10000, timeMin: 45 });
      expect(pace).toBeGreaterThanOrEqual(270);
      expect(pace).toBeLessThanOrEqual(285);
    });

    it('marathon in 3:30:00 → threshold pace ~4:40-4:55/km', () => {
      const pace = thresholdPaceFromRace({ distanceMeters: 42195, timeMin: 210 });
      expect(pace).toBeGreaterThanOrEqual(280);
      expect(pace).toBeLessThanOrEqual(295);
    });

    it('returns an integer (sec/km)', () => {
      const pace = thresholdPaceFromRace({ distanceMeters: 5000, timeMin: 20 });
      expect(Number.isInteger(pace)).toBe(true);
    });

    it('faster race → faster threshold pace', () => {
      const slow = thresholdPaceFromRace({ distanceMeters: 5000, timeMin: 25 });
      const fast = thresholdPaceFromRace({ distanceMeters: 5000, timeMin: 18 });
      expect(fast).toBeLessThan(slow);
    });
  });

  describe('METERS_BY_RACE_DISTANCE', () => {
    it('maps all standard distances', () => {
      expect(METERS_BY_RACE_DISTANCE['5k']).toBe(5000);
      expect(METERS_BY_RACE_DISTANCE['10k']).toBe(10000);
      expect(METERS_BY_RACE_DISTANCE['half-marathon']).toBe(21097.5);
      expect(METERS_BY_RACE_DISTANCE['marathon']).toBe(42195);
    });
  });

  describe(vdotFromRace.name, () => {
    it('5K in 20:00 → VDOT ~49-50', () => {
      const vdot = vdotFromRace({ distanceMeters: 5000, timeMin: 20 });
      expect(vdot).toBeGreaterThanOrEqual(49);
      expect(vdot).toBeLessThanOrEqual(51);
    });

    it('marathon in 3:00:00 → VDOT ~53-54', () => {
      const vdot = vdotFromRace({ distanceMeters: 42195, timeMin: 180 });
      expect(vdot).toBeGreaterThanOrEqual(53);
      expect(vdot).toBeLessThanOrEqual(55);
    });

    it('higher fitness → higher VDOT', () => {
      const slow = vdotFromRace({ distanceMeters: 5000, timeMin: 25 });
      const fast = vdotFromRace({ distanceMeters: 5000, timeMin: 18 });
      expect(fast).toBeGreaterThan(slow);
    });
  });

  describe(predictRaceTime.name, () => {
    it('20:00 5K → 10K prediction ~41-42 min', () => {
      const vdot = vdotFromRace({ distanceMeters: 5000, timeMin: 20 });
      const time = predictRaceTime({ vdot, targetDistanceMeters: 10000 });
      expect(time).toBeDefined();
      expect(time ?? 0).toBeGreaterThanOrEqual(41 * 60);
      expect(time ?? Infinity).toBeLessThanOrEqual(42 * 60 + 30);
    });

    it('round-trips: predicting the input distance recovers the input time', () => {
      const vdot = vdotFromRace({ distanceMeters: 5000, timeMin: 20 });
      const time = predictRaceTime({ vdot, targetDistanceMeters: 5000 });
      expect(time).toBeDefined();
      expect((time ?? 0) / 60).toBeCloseTo(20, 1);
    });

    it('returns undefined for invalid inputs', () => {
      expect(predictRaceTime({ vdot: 0, targetDistanceMeters: 5000 })).toBeUndefined();
      expect(predictRaceTime({ vdot: 42, targetDistanceMeters: 0 })).toBeUndefined();
      expect(predictRaceTime({ vdot: -1, targetDistanceMeters: 5000 })).toBeUndefined();
    });

    it('longer distances produce longer times', () => {
      const vdot = vdotFromRace({ distanceMeters: 5000, timeMin: 20 });
      const t5k = predictRaceTime({ vdot, targetDistanceMeters: 5000 });
      const t10k = predictRaceTime({ vdot, targetDistanceMeters: 10000 });
      const tHalf = predictRaceTime({ vdot, targetDistanceMeters: 21097.5 });
      const tMarathon = predictRaceTime({ vdot, targetDistanceMeters: 42195 });
      if (t5k == null || t10k == null || tHalf == null || tMarathon == null) {
        return expect(t5k && t10k && tHalf && tMarathon).toBeDefined();
      }
      expect(t10k).toBeGreaterThan(t5k);
      expect(tHalf).toBeGreaterThan(t10k);
      expect(tMarathon).toBeGreaterThan(tHalf);
    });
  });

  describe(predictRaceTimes.name, () => {
    it('returns predictions for all 4 standard distances', () => {
      const result = predictRaceTimes({ distanceMeters: 5000, timeSec: 20 * 60 });
      expect(result).toBeDefined();
      expect(result?.['5k']).toBeDefined();
      expect(result?.['10k']).toBeDefined();
      expect(result?.['half-marathon']).toBeDefined();
      expect(result?.['marathon']).toBeDefined();
    });

    it('5K input time matches the 5K prediction', () => {
      const result = predictRaceTimes({ distanceMeters: 5000, timeSec: 20 * 60 });
      expect(result?.['5k'].timeSec).toBeCloseTo(20 * 60, 0);
    });

    it('each prediction includes pace in sec/km', () => {
      const result = predictRaceTimes({ distanceMeters: 5000, timeSec: 20 * 60 });
      expect(result?.['5k'].paceSecPerKm).toBeCloseTo(240, 0);
    });

    it('returns undefined for degenerate input', () => {
      expect(predictRaceTimes({ distanceMeters: 0, timeSec: 1200 })).toBeUndefined();
    });
  });
});
