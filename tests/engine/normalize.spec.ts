import { describe, it, expect } from 'vitest';
import {
  calculateNormalizedPower,
  gradeAdjustedPaceFactor,
  calculateGAP,
} from '@/packages/engine/normalize.ts';
import { makeCyclingRecords } from '@tests/factories/records.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

function makeRecord(overrides: Partial<SessionRecord>): SessionRecord {
  return { timestamp: 0, ...overrides };
}

describe('calculateNormalizedPower', () => {
  it('returns undefined for fewer than 30 records', () => {
    const records = makeCyclingRecords(29);
    expect(calculateNormalizedPower(records)).toBeUndefined();
  });

  it('returns undefined for records with no power data', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 60; i++) {
      records.push(makeRecord({ timestamp: i, hr: 140 }));
    }
    expect(calculateNormalizedPower(records)).toBeUndefined();
  });

  it('returns undefined for records with all zero power', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 60; i++) {
      records.push(makeRecord({ timestamp: i, power: 0 }));
    }
    expect(calculateNormalizedPower(records)).toBeUndefined();
  });

  it('returns NP close to average for constant power', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 120; i++) {
      records.push(makeRecord({ timestamp: i, power: 200 }));
    }
    const np = calculateNormalizedPower(records);
    expect(np).toBeDefined();
    expect(np).toBe(200);
  });

  it('returns NP greater than average for variable power', () => {
    const records: SessionRecord[] = [];
    let totalPower = 0;
    for (let i = 0; i < 300; i++) {
      // Oscillate between 100W and 300W
      const power = 200 + 100 * Math.sin(i * 0.1);
      totalPower += power;
      records.push(makeRecord({ timestamp: i, power }));
    }
    const avgPower = totalPower / 300;
    const np = calculateNormalizedPower(records);
    expect(np).toBeDefined();
    expect(np ?? 0).toBeGreaterThan(avgPower);
  });

  it('returns a rounded integer', () => {
    const records = makeCyclingRecords(120);
    const np = calculateNormalizedPower(records);
    expect(np).toBeDefined();
    expect(Number.isInteger(np)).toBe(true);
  });

  it('filters out records without power before computing', () => {
    const records: SessionRecord[] = [];
    // 60 records with power, interspersed with 60 without
    for (let i = 0; i < 120; i++) {
      if (i % 2 === 0) {
        records.push(makeRecord({ timestamp: i, power: 200 }));
      } else {
        records.push(makeRecord({ timestamp: i, hr: 150 }));
      }
    }
    // 60 power records >= 30 threshold
    const np = calculateNormalizedPower(records);
    expect(np).toBeDefined();
    expect(np).toBe(200);
  });
});

describe('gradeAdjustedPaceFactor', () => {
  it('returns factor close to 1.0 for flat gradient', () => {
    const factor = gradeAdjustedPaceFactor(0);
    expect(factor).toBeCloseTo(1.0, 5);
  });

  it('returns factor greater than 1.0 for uphill', () => {
    const factor = gradeAdjustedPaceFactor(0.1); // 10% uphill
    expect(factor).toBeGreaterThan(1.0);
  });

  it('returns factor less than 1.0 for moderate downhill', () => {
    const factor = gradeAdjustedPaceFactor(-0.1); // 10% downhill
    expect(factor).toBeLessThan(1.0);
  });

  it('clamps gradient at +0.45', () => {
    const atClamp = gradeAdjustedPaceFactor(0.45);
    const beyondClamp = gradeAdjustedPaceFactor(0.6);
    expect(beyondClamp).toBe(atClamp);
  });

  it('clamps gradient at -0.45', () => {
    const atClamp = gradeAdjustedPaceFactor(-0.45);
    const beyondClamp = gradeAdjustedPaceFactor(-0.6);
    expect(beyondClamp).toBe(atClamp);
  });

  it('steeper uphill produces higher factor than gentle uphill', () => {
    const gentle = gradeAdjustedPaceFactor(0.05);
    const steep = gradeAdjustedPaceFactor(0.2);
    expect(steep).toBeGreaterThan(gentle);
  });
});

describe('calculateGAP', () => {
  it('returns undefined for empty records', () => {
    expect(calculateGAP([])).toBeUndefined();
  });

  it('returns undefined for single record', () => {
    const records = [makeRecord({ timestamp: 0, speed: 3.0, distance: 0, grade: 0 })];
    expect(calculateGAP(records)).toBeUndefined();
  });

  it('returns undefined for records without speed', () => {
    const records = [
      makeRecord({ timestamp: 0, distance: 0, grade: 0 }),
      makeRecord({ timestamp: 1, distance: 3, grade: 0 }),
    ];
    expect(calculateGAP(records)).toBeUndefined();
  });

  it('returns GAP close to actual pace on flat terrain', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 0,
        }),
      );
    }
    const gap = calculateGAP(records);
    const actualPace = (1 / 3.0) * 1000; // sec/km
    expect(gap).toBeDefined();
    expect(Math.abs((gap ?? 0) - actualPace)).toBeLessThan(1);
  });
});
