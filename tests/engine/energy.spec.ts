import { describe, it, expect } from 'vitest';
import { estimateSessionEnergy, sessionWorkKj, type EnergyBody } from '@/packages/engine/energy.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const MALE: EnergyBody = { weightKg: 70, age: 35, gender: 'male' };

const steadyRide = (count: number, power: number | undefined, hr?: number): SessionRecord[] =>
  Array.from({ length: count }, (_, i) => ({ timestamp: i, speed: 8, power, hr }));

const steadyRun = (seconds: number, hr?: number): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) => ({ timestamp: i, speed: 3, distance: i * 3, hr }));

const flat = (records: SessionRecord[], gradient = 0): Array<number | undefined> =>
  records.map(() => gradient);

const kcalOf = (result: ReturnType<typeof estimateSessionEnergy>): number => {
  if (result === undefined || 'blockedBy' in result) return NaN;
  return result.kcal;
};

describe('estimateSessionEnergy — power', () => {
  it('converts an hour at 210 W at 21 % efficiency, with a ±15 % range', () => {
    const result = estimateSessionEnergy(steadyRide(3601, 210), 'cycling', { gender: 'male' });
    if (result === undefined || 'blockedBy' in result) throw new Error('no estimate');
    expect(result.method).toBe('power');
    expect(result.kcal).toBeCloseTo(860.4, 1);
    expect(result.lowKcal).toBeCloseTo(731.4, 1);
    expect(result.highKcal).toBeCloseTo(989.5, 1);
  });

  it('covers 0 W records at 0 J', () => {
    const records = [...steadyRide(1801, 210), ...steadyRide(1800, 0)].map((r, i) => ({
      ...r,
      timestamp: i,
    }));
    const result = estimateSessionEnergy(records, 'cycling', { gender: 'male' });
    expect(kcalOf(result)).toBeCloseTo(860.4 / 2, 1);
  });

  it('adds nothing across a 30 s gap', () => {
    const records = steadyRide(3601, 210).map((r, i) => {
      if (i < 1801) return r;
      return { ...r, timestamp: r.timestamp + 30 };
    });
    const result = estimateSessionEnergy(records, 'cycling', { gender: 'male' });
    expect(kcalOf(result)).toBeCloseTo(860.4 * (3599 / 3600), 1);
  });
});

describe('estimateSessionEnergy — running', () => {
  it('estimates a flat 1000 s run at 3 m/s for 70 kg', () => {
    const records = steadyRun(1000);
    const result = estimateSessionEnergy(records, 'running', MALE, flat(records));
    expect(kcalOf(result)).toBeCloseTo(229.4, 1);
  });

  it('costs more uphill at 10 %', () => {
    const records = steadyRun(1000);
    const result = estimateSessionEnergy(records, 'running', MALE, flat(records, 0.1));
    expect(kcalOf(result)).toBeCloseTo(321.2, 1);
  });
});

describe('estimateSessionEnergy — heart rate (Keytel)', () => {
  const hrRide = steadyRide(3601, undefined, 150);

  it('estimates a male hour at 150 bpm', () => {
    expect(kcalOf(estimateSessionEnergy(hrRide, 'cycling', MALE))).toBeCloseTo(867.8, 1);
  });

  it('estimates a female hour at 150 bpm', () => {
    const body: EnergyBody = { weightKg: 60, age: 35, gender: 'female' };
    expect(kcalOf(estimateSessionEnergy(hrRide, 'cycling', body))).toBeCloseTo(597.8, 1);
  });

  it('averages both equations for other', () => {
    const body: EnergyBody = { weightKg: 60, age: 35, gender: 'other' };
    expect(kcalOf(estimateSessionEnergy(hrRide, 'cycling', body))).toBeCloseTo(718.6, 1);
  });

  it('clamps at 1 kcal/kg/h', () => {
    const body: EnergyBody = { weightKg: 60, age: 35, gender: 'female' };
    const result = estimateSessionEnergy(steadyRide(3601, undefined, 60), 'cycling', body);
    expect(kcalOf(result)).toBeCloseTo(60, 6);
  });
});

describe('estimateSessionEnergy — method choice', () => {
  it('falls back to heart rate when power covers only 85 %', () => {
    const records = steadyRide(1001, 210, 150).map((r, i) => {
      if (i <= 850) return r;
      return { ...r, power: undefined };
    });
    const result = estimateSessionEnergy(records, 'cycling', MALE);
    expect(result !== undefined && 'method' in result && result.method).toBe('heartRate');
  });

  it('falls back to heart rate on a run without elevation', () => {
    const result = estimateSessionEnergy(steadyRun(1000, 150), 'running', MALE);
    expect(result !== undefined && 'method' in result && result.method).toBe('heartRate');
  });

  it('asks for weight on a run without it', () => {
    const records = steadyRun(1000, 150);
    const result = estimateSessionEnergy(
      records,
      'running',
      { age: 35, gender: 'male' },
      flat(records),
    );
    expect(result).toEqual({ blockedBy: 'weight' });
  });

  it('asks for weight and birth year on a heart-rate session without them', () => {
    const result = estimateSessionEnergy(steadyRide(1001, undefined, 150), 'cycling', {
      gender: 'male',
    });
    expect(result).toEqual({ blockedBy: 'weightAndAge' });
  });

  it('asks only for the birth year on a heart-rate session that has a weight', () => {
    const result = estimateSessionEnergy(steadyRide(1001, undefined, 150), 'cycling', {
      weightKg: 70,
      gender: 'male',
    });
    expect(result).toEqual({ blockedBy: 'age' });
  });

  it('asks only for the weight on a heart-rate session that has a birth year', () => {
    const result = estimateSessionEnergy(steadyRide(1001, undefined, 150), 'cycling', {
      age: 35,
      gender: 'male',
    });
    expect(result).toEqual({ blockedBy: 'weight' });
  });

  it('is undefined without power and heart rate', () => {
    expect(estimateSessionEnergy(steadyRide(1001, undefined), 'cycling', MALE)).toBeUndefined();
  });
});

describe('sessionWorkKj', () => {
  it('sums power over time', () => {
    expect(sessionWorkKj(steadyRide(3601, 210))).toBeCloseTo(756, 6);
  });

  it('counts a 0 W ride as 0 kJ', () => {
    expect(sessionWorkKj(steadyRide(60, 0))).toBe(0);
  });

  it('is undefined without power', () => {
    expect(sessionWorkKj(steadyRide(60, undefined))).toBeUndefined();
  });
});
