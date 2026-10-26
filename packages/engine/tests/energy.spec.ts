import { describe, it, expect } from 'vite-plus/test';
import { estimateSessionEnergy, type EnergyBody } from '../src/energy.ts';
import { windowedGradients } from '../src/gradient.ts';
import type { SessionRecord } from '../src/types.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

const MALE: EnergyBody = { weightKg: 70, age: 35, gender: 'male' };

const steadyRide = (count: number, power: number | undefined, hr?: number): SessionRecord[] =>
  Array.from({ length: count }, (_, i) =>
    createMockSessionRecord({ timestamp: i, speed: 8, power, hr }),
  );

const steadyRun = (seconds: number, hr?: number): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) =>
    createMockSessionRecord({ timestamp: i, speed: 3, distance: i * 3, hr }),
  );

const flat = (records: SessionRecord[], gradient = 0): Array<number | undefined> =>
  records.map(() => gradient);

const kcalOf = (result: ReturnType<typeof estimateSessionEnergy>): number => {
  if (result === undefined || 'blockedBy' in result) return NaN;
  return result.kcal;
};

describe(estimateSessionEnergy.name, () => {
  describe('power', () => {
    it('converts an hour at 210 W at 21 % efficiency, with a ±15 % range', () => {
      const records = steadyRide(3601, 210);
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { gender: 'male' },
        gradients: windowedGradients(records),
      });
      if (result === undefined || 'blockedBy' in result) throw new Error('no estimate');
      expect(result.method).toBe('power');
      expect(result.kcal).toBeCloseTo(860.4, 1);
      expect(result.uncertainty).toBe(0.15);
    });

    it('covers 0 W records at 0 J', () => {
      const records = [...steadyRide(1801, 210), ...steadyRide(1800, 0)].map((r, i) =>
        createMockSessionRecord({ ...r, timestamp: i }),
      );
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { gender: 'male' },
        gradients: windowedGradients(records),
      });
      expect(kcalOf(result)).toBeCloseTo(860.4 / 2, 1);
    });

    it('adds nothing across a 30 s gap', () => {
      const records = steadyRide(3601, 210).map((r, i) => {
        if (i < 1801) return r;
        return createMockSessionRecord({ ...r, timestamp: r.timestamp + 30 });
      });
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { gender: 'male' },
        gradients: windowedGradients(records),
      });
      expect(kcalOf(result)).toBeCloseTo(860.4 * (3599 / 3600), 1);
    });
  });

  describe('running', () => {
    it('estimates a flat 1000 s run at 3 m/s for 70 kg', () => {
      const records = steadyRun(1000);
      const result = estimateSessionEnergy({
        records,
        sport: 'running',
        body: MALE,
        gradients: flat(records),
      });
      expect(kcalOf(result)).toBeCloseTo(229.4, 1);
    });

    it('costs more uphill at 10 %', () => {
      const records = steadyRun(1000);
      const result = estimateSessionEnergy({
        records,
        sport: 'running',
        body: MALE,
        gradients: flat(records, 0.1),
      });
      expect(kcalOf(result)).toBeCloseTo(321.2, 1);
    });
  });

  describe('heart rate (Keytel)', () => {
    const hrRide = steadyRide(3601, undefined, 150);

    it('estimates a male hour at 150 bpm', () => {
      expect(
        kcalOf(
          estimateSessionEnergy({
            records: hrRide,
            sport: 'cycling',
            body: MALE,
            gradients: windowedGradients(hrRide),
          }),
        ),
      ).toBeCloseTo(867.8, 1);
    });

    it('estimates a female hour at 150 bpm', () => {
      const body: EnergyBody = { weightKg: 60, age: 35, gender: 'female' };
      expect(
        kcalOf(
          estimateSessionEnergy({
            records: hrRide,
            sport: 'cycling',
            body,
            gradients: windowedGradients(hrRide),
          }),
        ),
      ).toBeCloseTo(597.8, 1);
    });

    it('no heart-rate estimate without gender', () => {
      const body: EnergyBody = { weightKg: 60, age: 35 };
      expect(
        estimateSessionEnergy({
          records: hrRide,
          sport: 'cycling',
          body,
          gradients: windowedGradients(hrRide),
        }),
      ).toBeUndefined();
    });

    it('clamps at 1 kcal/kg/h', () => {
      const body: EnergyBody = { weightKg: 60, age: 35, gender: 'female' };
      const records = steadyRide(3601, undefined, 60);
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body,
        gradients: windowedGradients(records),
      });
      expect(kcalOf(result)).toBeCloseTo(60, 6);
    });
  });

  describe('method choice', () => {
    it('falls back to heart rate when power covers only 85 %', () => {
      const records = steadyRide(1001, 210, 150).map((r, i) => {
        if (i <= 850) return r;
        return { ...r, power: undefined };
      });
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: MALE,
        gradients: windowedGradients(records),
      });
      expect(result !== undefined && 'method' in result && result.method).toBe('heartRate');
    });

    it('falls back to heart rate on a run without elevation', () => {
      const records = steadyRun(1000, 150);
      const result = estimateSessionEnergy({
        records,
        sport: 'running',
        body: MALE,
        gradients: windowedGradients(records),
      });
      expect(result !== undefined && 'method' in result && result.method).toBe('heartRate');
    });

    it('asks for weight on a run without it', () => {
      const records = steadyRun(1000, 150);
      const result = estimateSessionEnergy({
        records,
        sport: 'running',
        body: { age: 35, gender: 'male' },
        gradients: flat(records),
      });
      expect(result).toEqual({ blockedBy: 'weight' });
    });

    it('asks for weight and birth year on a heart-rate session without them', () => {
      const records = steadyRide(1001, undefined, 150);
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { gender: 'male' },
        gradients: windowedGradients(records),
      });
      expect(result).toEqual({ blockedBy: 'weightAndAge' });
    });

    it('asks only for the birth year on a heart-rate session that has a weight', () => {
      const records = steadyRide(1001, undefined, 150);
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { weightKg: 70, gender: 'male' },
        gradients: windowedGradients(records),
      });
      expect(result).toEqual({ blockedBy: 'age' });
    });

    it('asks only for the weight on a heart-rate session that has a birth year', () => {
      const records = steadyRide(1001, undefined, 150);
      const result = estimateSessionEnergy({
        records,
        sport: 'cycling',
        body: { age: 35, gender: 'male' },
        gradients: windowedGradients(records),
      });
      expect(result).toEqual({ blockedBy: 'weight' });
    });

    it('is undefined without power and heart rate', () => {
      const records = steadyRide(1001, undefined);
      expect(
        estimateSessionEnergy({
          records,
          sport: 'cycling',
          body: MALE,
          gradients: windowedGradients(records),
        }),
      ).toBeUndefined();
    });
  });
});
