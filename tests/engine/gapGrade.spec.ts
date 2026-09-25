import { describe, it, expect } from 'vitest';
import { calculateGAP } from '@/packages/engine/normalize.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

function makeRecord(overrides: Partial<SessionRecord>): SessionRecord {
  return { timestamp: 0, ...overrides };
}

describe('calculateGAP with native grade', () => {
  it('uses native grade field when available', () => {
    // 5% uphill grade, records spaced 1s apart with 3m/s speed
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 5, // 5% grade (FIT percentage format)
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
    // Uphill grade should make GAP faster (lower sec/km) than actual pace
    // because metabolic cost is higher uphill
    const flatPace = (1 / 3.0) * 1000; // ~333 sec/km
    expect(gap ?? Infinity).toBeLessThan(flatPace);
  });

  it('falls back to elevation delta when grade is missing', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          elevation: 100 + i * 0.15, // ~5% grade
          // no grade field
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
    expect(gap ?? 0).toBeGreaterThan(0);
  });

  it('records with grade but no elevation still produce valid GAP', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 0, // flat
          // no elevation field
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
  });

  it('grade normalization: FIT percentage converted to fraction', () => {
    // Grade of 10% = 0.10 fraction. gradeAdjustedPaceFactor expects fraction.
    const recordsWithGrade: SessionRecord[] = [];
    const recordsWithElevation: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      recordsWithGrade.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 10, // 10% in FIT format
        }),
      );
      recordsWithElevation.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          elevation: 100 + i * 0.3, // 0.3m per 3m = 10% grade
        }),
      );
    }

    const gapFromGrade = calculateGAP(recordsWithGrade);
    const gapFromElevation = calculateGAP(recordsWithElevation);

    expect(gapFromGrade).toBeDefined();
    expect(gapFromElevation).toBeDefined();
    if (gapFromGrade === undefined || gapFromElevation === undefined) return;
    // Both should produce similar results (within 5% tolerance)
    const ratio = gapFromGrade / gapFromElevation;
    expect(ratio).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });

  it('flat grade produces GAP close to actual pace', () => {
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
    const actualPace = (1 / 3.0) * 1000;
    expect(gap).toBeDefined();
    // Should be very close to actual pace on flat terrain
    expect(Math.abs((gap ?? 0) - actualPace)).toBeLessThan(1);
  });

  it('returns undefined for fewer than 2 records', () => {
    const records = [makeRecord({ timestamp: 0, speed: 3, distance: 0, grade: 0 })];
    expect(calculateGAP(records)).toBeUndefined();
  });

  it('downhill grade produces GAP slower (higher sec/km) than actual pace', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: -5,
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
    const flatPace = (1 / 3.0) * 1000;
    expect(gap ?? 0).toBeGreaterThan(flatPace);
  });

  it('uphill GAP is faster than flat, downhill GAP is slower than flat', () => {
    const makeRecordsWithGrade = (grade: number): SessionRecord[] => {
      const recs: SessionRecord[] = [];
      for (let i = 0; i < 10; i++) {
        recs.push(
          makeRecord({
            timestamp: i,
            speed: 3.0,
            distance: i * 3,
            grade,
          }),
        );
      }
      return recs;
    };

    const flatPace = (1 / 3.0) * 1000;
    const uphillGap = calculateGAP(makeRecordsWithGrade(8));
    const downhillGap = calculateGAP(makeRecordsWithGrade(-8));
    expect(uphillGap).toBeDefined();
    expect(downhillGap).toBeDefined();
    if (uphillGap === undefined || downhillGap === undefined) return;

    expect(uphillGap).toBeLessThan(flatPace);
    expect(downhillGap).toBeGreaterThan(flatPace);
  });

  it('mixed uphill+downhill route has no Jensen inequality bias', () => {
    // Symmetric route: half at +10%, half at -10%, same speed and spacing.
    // The Minetti curve is inherently asymmetric (uphill costs more than
    // downhill saves), so GAP won't equal flat pace exactly — but the
    // distance-adjusted formula keeps deviation under ~15%.
    // The old dt/factor formula would exceed 25% due to 1/x convexity.
    const records: SessionRecord[] = [];
    for (let i = 0; i < 11; i++) {
      let grade = -10;
      if (i < 6) {
        grade = 10;
      }
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade,
        }),
      );
    }

    const gap = calculateGAP(records);
    const flatPace = (1 / 3.0) * 1000;
    expect(gap).toBeDefined();
    // Distance-adjusted: ~11% deviation (Minetti asymmetry)
    // Old dt/factor would be ~27% — this threshold catches regressions
    expect(Math.abs((gap ?? 0) - flatPace) / flatPace).toBeLessThan(0.15);
  });
});
