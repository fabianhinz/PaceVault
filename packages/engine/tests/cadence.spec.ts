import { describe, it, expect } from 'vite-plus/test';
import { coastingSeconds, stepLength } from '../src/cadence.ts';
import type { SessionRecord } from '../src/types.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

const ride = (powers: number[], cadences?: number[]): SessionRecord[] =>
  powers.map((power, i) =>
    createMockSessionRecord({ timestamp: i, speed: 8, power, cadence: cadences?.[i] }),
  );

describe('cadence', () => {
  describe(coastingSeconds.name, () => {
    it('counts 0 W while moving, and 0 rpm where cadence is recorded', () => {
      expect(coastingSeconds(ride([200, 0, 0, 200, 150], [90, 0, 0, 90, 0]))).toBe(3);
    });

    it('counts 0 W intervals on a power-only ride', () => {
      expect(coastingSeconds(ride([200, 0, 0, 200, 200]))).toBe(2);
    });

    it('skips stopped intervals and a 30 s gap', () => {
      const records: SessionRecord[] = [
        createMockSessionRecord({ timestamp: 0, speed: 8, power: 200 }),
        createMockSessionRecord({ timestamp: 1, speed: 0, power: 0 }),
        createMockSessionRecord({ timestamp: 2, speed: 0, power: 0 }),
        createMockSessionRecord({ timestamp: 32, speed: 8, power: 0 }),
        createMockSessionRecord({ timestamp: 33, speed: 8, power: 0 }),
      ];
      expect(coastingSeconds(records)).toBe(1);
    });

    it('is undefined without power', () => {
      expect(
        coastingSeconds([
          createMockSessionRecord({ timestamp: 0, speed: 8 }),
          createMockSessionRecord({ timestamp: 1, speed: 8 }),
        ]),
      ).toBeUndefined();
    });
  });

  const run = (seconds: number, cadence: number | undefined): SessionRecord[] =>
    Array.from({ length: seconds + 1 }, (_, i) =>
      createMockSessionRecord({
        timestamp: i,
        speed: 3,
        distance: i * 3,
        cadence,
      }),
    );

  describe(stepLength.name, () => {
    it('divides distance by steps at 3 m/s and 85 strides/min', () => {
      const result = stepLength(run(600, 85));
      expect(result?.lengthMeters).toBeCloseTo(1.06, 2);
      expect(result?.stepsPerMinute).toBeCloseTo(170, 6);
    });

    it('is undefined without cadence', () => {
      expect(stepLength(run(600, undefined))).toBeUndefined();
    });

    it('is null when every recorded cadence is 0', () => {
      expect(stepLength(run(600, 0))).toBeNull();
    });
  });
});
