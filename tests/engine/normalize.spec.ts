import { describe, it, expect } from 'vitest';
import {
  calculateNormalizedPower,
  gradeAdjustedPaceFactor,
  calculateGAP,
} from '@/packages/engine/normalize.ts';
import { makeCyclingRecords } from '@tests/factories/records.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const makeRecord = (overrides: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  ...overrides,
});

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

  it('returns 0 for records with all zero power', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 60; i++) {
      records.push(makeRecord({ timestamp: i, power: 0 }));
    }
    expect(calculateNormalizedPower(records)).toBe(0);
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
    for (let i = 0; i < 120; i++) {
      if (i % 2 === 0) {
        records.push(makeRecord({ timestamp: i, power: 200 }));
      } else {
        records.push(makeRecord({ timestamp: i, hr: 150 }));
      }
    }
    const np = calculateNormalizedPower(records);
    expect(np).toBeDefined();
    expect(np).toBe(200);
  });
});

describe('gradeAdjustedPaceFactor', () => {
  const grid = Array.from({ length: 601 }, (_, i) => -0.3 + i * 0.001);

  it('costs exactly flat effort at 0 %', () => {
    expect(gradeAdjustedPaceFactor(0)).toBe(1);
  });

  it('bottoms out around 0.88 near −9 %', () => {
    const factors = grid.map((g) => gradeAdjustedPaceFactor(g));
    const min = Math.min(...factors);
    const at = grid[factors.indexOf(min)] ?? 0;
    expect(min).toBeCloseTo(0.88, 2);
    expect(at).toBeGreaterThanOrEqual(-0.1);
    expect(at).toBeLessThanOrEqual(-0.08);
  });

  it('is back at flat effort around −18 %', () => {
    expect(gradeAdjustedPaceFactor(-0.18)).toBeCloseTo(1, 1);
  });

  it('rises monotonically from −9 % to +30 %', () => {
    const uphill = grid.filter((g) => g >= -0.09).map((g) => gradeAdjustedPaceFactor(g));
    expect(uphill.every((f, i) => i === 0 || f > (uphill[i - 1] ?? Infinity))).toBe(true);
  });

  it('limits the gradient to ±30 %', () => {
    expect(gradeAdjustedPaceFactor(0.45)).toBe(gradeAdjustedPaceFactor(0.3));
    expect(gradeAdjustedPaceFactor(-0.45)).toBe(gradeAdjustedPaceFactor(-0.3));
  });
});

const steadyRun = (seconds: number, gradient: number): SessionRecord[] =>
  Array.from({ length: seconds }, (_, i) =>
    makeRecord({ timestamp: i, speed: 3, distance: i * 3, elevation: 100 + i * 3 * gradient }),
  );

describe('calculateGAP', () => {
  it('returns undefined for empty records', () => {
    expect(calculateGAP([])).toBeUndefined();
  });

  it('returns undefined for records without speed', () => {
    const records = steadyRun(60, 0).map((r) => makeRecord({ ...r, speed: undefined }));
    expect(calculateGAP(records)).toBeUndefined();
  });

  it('returns the actual pace on flat terrain', () => {
    expect(calculateGAP(steadyRun(120, 0))).toBeCloseTo(1000 / 3, 6);
  });

  it('is faster than the actual pace uphill and slower on a gentle descent', () => {
    expect(calculateGAP(steadyRun(120, 0.08)) ?? 0).toBeLessThan(1000 / 3);
    expect(calculateGAP(steadyRun(120, -0.08)) ?? 0).toBeGreaterThan(1000 / 3);
  });

  it('pairs records that carry a distance when the device writes it only every few seconds', () => {
    const sparse = steadyRun(300, 0.08).map((r) => {
      if (r.timestamp % 3 === 0) return r;
      return makeRecord({ ...r, distance: undefined });
    });
    expect(calculateGAP(sparse)).toBeCloseTo(calculateGAP(steadyRun(300, 0.08)) ?? 0, 0);
  });

  it('session GAP ignores stops and timer pauses', () => {
    const running = steadyRun(600, 0);
    const stop = Array.from({ length: 300 }, (_, i) =>
      makeRecord({ timestamp: 600 + i, speed: 0, distance: 1797, elevation: 100 }),
    );
    const afterPause = steadyRun(600, 0).map((r) =>
      makeRecord({ ...r, timestamp: r.timestamp + 1500, distance: (r.distance ?? 0) + 1800 }),
    );
    expect(calculateGAP([...running, ...stop, ...afterPause])).toBeCloseTo(1000 / 3, 6);
  });
});

describe('calculateNormalizedPower with recorded zeros', () => {
  it('counts zeros in the rolling window, so coasting lowers NP', () => {
    const riding = Array.from({ length: 60 }, (_, i) => makeRecord({ timestamp: i, power: 200 }));
    const coasting = Array.from({ length: 60 }, (_, i) =>
      makeRecord({ timestamp: 60 + i, power: 0 }),
    );
    expect(calculateNormalizedPower([...riding, ...coasting]) ?? 0).toBeLessThan(200);
  });

  it('skips records without power', () => {
    const records = Array.from({ length: 60 }, (_, i) =>
      makeRecord({ timestamp: i, power: i % 2 === 0 ? 200 : undefined }),
    );
    expect(calculateNormalizedPower(records)).toBe(200);
  });
});
