import { describe, it, expect } from 'vite-plus/test';
import {
  timeFromPaceAndDistance,
  paceFromDistanceAndTime,
  distanceFromPaceAndTime,
} from '../src/paceCalculator.ts';

describe('paceCalculator', () => {
  describe(timeFromPaceAndDistance.name, () => {
    it('5:00/km for 10km → 3000s (50:00)', () => {
      expect(timeFromPaceAndDistance({ paceSecPerKm: 300, distanceMeters: 10000 })).toBe(3000);
    });

    it('4:00/km for 5km → 1200s (20:00)', () => {
      expect(timeFromPaceAndDistance({ paceSecPerKm: 240, distanceMeters: 5000 })).toBe(1200);
    });

    it('returns 0 when distance is 0', () => {
      expect(timeFromPaceAndDistance({ paceSecPerKm: 300, distanceMeters: 0 })).toBe(0);
    });
  });

  describe(paceFromDistanceAndTime.name, () => {
    it('10km in 50:00 → 300 sec/km (5:00/km)', () => {
      expect(paceFromDistanceAndTime({ distanceMeters: 10000, timeSec: 3000 })).toBe(300);
    });

    it('marathon in 3:30:00 → ~298 sec/km', () => {
      const pace = paceFromDistanceAndTime({ distanceMeters: 42195, timeSec: 3.5 * 3600 });
      expect(pace).toBeCloseTo(298.6, 0);
    });
  });

  describe(distanceFromPaceAndTime.name, () => {
    it('5:00/km for 50:00 → 10000m', () => {
      expect(distanceFromPaceAndTime({ paceSecPerKm: 300, timeSec: 3000 })).toBe(10000);
    });

    it('returns 0 when time is 0', () => {
      expect(distanceFromPaceAndTime({ paceSecPerKm: 300, timeSec: 0 })).toBe(0);
    });
  });

  describe('round-trip consistency', () => {
    it('pace + distance → time → back to distance', () => {
      const pace = 270;
      const distance = 15000;
      const time = timeFromPaceAndDistance({ paceSecPerKm: pace, distanceMeters: distance });
      const recoveredDistance = distanceFromPaceAndTime({ paceSecPerKm: pace, timeSec: time });
      expect(recoveredDistance).toBeCloseTo(distance, 6);
    });

    it('distance + time → pace → back to time', () => {
      const distance = 21097.5;
      const time = 5400;
      const pace = paceFromDistanceAndTime({ distanceMeters: distance, timeSec: time });
      const recoveredTime = timeFromPaceAndDistance({
        paceSecPerKm: pace,
        distanceMeters: distance,
      });
      expect(recoveredTime).toBeCloseTo(time, 6);
    });

    it('pace + time → distance → back to pace', () => {
      const pace = 330;
      const time = 7200;
      const distance = distanceFromPaceAndTime({ paceSecPerKm: pace, timeSec: time });
      const recoveredPace = paceFromDistanceAndTime({ distanceMeters: distance, timeSec: time });
      expect(recoveredPace).toBeCloseTo(pace, 6);
    });
  });
});
