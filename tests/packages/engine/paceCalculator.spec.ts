import { describe, it, expect } from 'vitest';
import {
  timeFromPaceAndDistance,
  paceFromDistanceAndTime,
  distanceFromPaceAndTime,
} from '@/packages/engine/paceCalculator.ts';

describe('timeFromPaceAndDistance', () => {
  it('5:00/km for 10km → 3000s (50:00)', () => {
    expect(timeFromPaceAndDistance(300, 10000)).toBe(3000);
  });

  it('4:00/km for 5km → 1200s (20:00)', () => {
    expect(timeFromPaceAndDistance(240, 5000)).toBe(1200);
  });

  it('returns 0 when distance is 0', () => {
    expect(timeFromPaceAndDistance(300, 0)).toBe(0);
  });
});

describe('paceFromDistanceAndTime', () => {
  it('10km in 50:00 → 300 sec/km (5:00/km)', () => {
    expect(paceFromDistanceAndTime(10000, 3000)).toBe(300);
  });

  it('marathon in 3:30:00 → ~298 sec/km', () => {
    const pace = paceFromDistanceAndTime(42195, 3.5 * 3600);
    expect(pace).toBeCloseTo(298.6, 0);
  });
});

describe('distanceFromPaceAndTime', () => {
  it('5:00/km for 50:00 → 10000m', () => {
    expect(distanceFromPaceAndTime(300, 3000)).toBe(10000);
  });

  it('returns 0 when time is 0', () => {
    expect(distanceFromPaceAndTime(300, 0)).toBe(0);
  });
});

describe('round-trip consistency', () => {
  it('pace + distance → time → back to distance', () => {
    const pace = 270;
    const distance = 15000;
    const time = timeFromPaceAndDistance(pace, distance);
    const recoveredDistance = distanceFromPaceAndTime(pace, time);
    expect(recoveredDistance).toBeCloseTo(distance, 6);
  });

  it('distance + time → pace → back to time', () => {
    const distance = 21097.5;
    const time = 5400;
    const pace = paceFromDistanceAndTime(distance, time);
    const recoveredTime = timeFromPaceAndDistance(pace, distance);
    expect(recoveredTime).toBeCloseTo(time, 6);
  });

  it('pace + time → distance → back to pace', () => {
    const pace = 330;
    const time = 7200;
    const distance = distanceFromPaceAndTime(pace, time);
    const recoveredPace = paceFromDistanceAndTime(distance, time);
    expect(recoveredPace).toBeCloseTo(pace, 6);
  });
});
