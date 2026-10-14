import { describe, it, expect } from 'vitest';
import {
  calculateTrainingEffect,
  getTrainingEffectLabel,
  getTrainingEffectSummary,
  LT_HRR,
} from '@/packages/engine/trainingEffect.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { makeRunningRecords, makeCyclingRecords } from '@tests/factories/records.ts';

describe('calculateTrainingEffect', () => {
  it('returns undefined when maxHr <= restHr', () => {
    const records = makeRunningRecords(3600);
    expect(calculateTrainingEffect(records, 50, 50, 'male', 0)).toBeUndefined();
    expect(calculateTrainingEffect(records, 40, 50, 'male', 0)).toBeUndefined();
  });

  it('returns undefined when no records have HR data', () => {
    const records = makeRunningRecords(100).map((r) => ({
      ...r,
      hr: undefined,
    }));
    expect(calculateTrainingEffect(records, 190, 50, 'male', 0)).toBeUndefined();
  });

  it('1hr at exactly LT → aerobic TE 3.0 (reference anchor)', () => {
    const maxHr = 190;
    const restHr = 50;
    const ltHr = restHr + LT_HRR * (maxHr - restHr);
    const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) => ({
      sessionId: 's1',
      timestamp: i,
      hr: ltHr,
    }));
    const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
    expect(result).toBeDefined();
    expect(result?.aerobic).toBe(3.0);
  });

  it('6min at exactly VO2max → anaerobic TE 3.0 (reference anchor)', () => {
    const maxHr = 190;
    const restHr = 50;
    const records: SessionRecord[] = Array.from({ length: 360 }, (_, i) => ({
      sessionId: 's1',
      timestamp: i,
      hr: maxHr, // 100% HRR
    }));
    const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
    expect(result).toBeDefined();
    expect(result?.anaerobic).toBe(3.0);
  });

  it('computes aerobic TE > 0 for a 1-hour running session with HR data', () => {
    const records = makeRunningRecords(3600, { baseHr: 155 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result?.aerobic).toBeGreaterThan(0);
    expect(result?.aerobic).toBeLessThanOrEqual(5);
  });

  it('aerobic TE is clamped to [0, 5]', () => {
    // Very long, very hard session should still cap at 5
    const records = makeRunningRecords(7200, { baseHr: 185 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result?.aerobic).toBeLessThanOrEqual(5);
    expect(result?.aerobic).toBeGreaterThanOrEqual(0);
  });

  it('anaerobic TE is 0 when HR stays well below 90% HRR', () => {
    // baseHr=100 with maxHr=190, restHr=50 → HRR ≈ 0.36, well below 0.9
    const records = makeRunningRecords(3600, { baseHr: 100 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result?.anaerobic).toBe(0);
  });

  it('anaerobic TE > 0 when HR is above 90% HRR threshold', () => {
    // baseHr=180 with maxHr=190, restHr=50 → HRR ≈ 0.93, above 0.9
    const records = makeRunningRecords(600, { baseHr: 180 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result?.anaerobic).toBeGreaterThan(0);
  });

  it('higher CTL reduces TE for the same effort', () => {
    const records = makeRunningRecords(3600, { baseHr: 155 });

    const lowFitness = calculateTrainingEffect(records, 190, 50, 'male', 0);
    const highFitness = calculateTrainingEffect(records, 190, 50, 'male', 100);

    expect(lowFitness).toBeDefined();
    expect(highFitness).toBeDefined();
    if (!lowFitness || !highFitness) return;
    expect(lowFitness.aerobic).toBeGreaterThan(highFitness.aerobic);
  });

  it('gender affects the result due to different Banister b-coefficients', () => {
    // The a-coefficient cancels in aerobicTrimp/trimpRef, so only b (1.92 vs 1.67)
    // matters. At low HRR the gap is largest. Using constant HR=78 (HRR=0.20) for
    // determinism: male TE ≈ 1.5, female TE ≈ 1.6.
    const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) => ({
      sessionId: 's1',
      timestamp: i,
      hr: 78,
    }));

    const male = calculateTrainingEffect(records, 190, 50, 'male', 0);
    const female = calculateTrainingEffect(records, 190, 50, 'female', 0);

    expect(male).toBeDefined();
    expect(female).toBeDefined();
    if (!male || !female) return;
    expect(female.aerobic).toBeGreaterThan(male.aerobic);
  });

  it('works with cycling records that have HR data', () => {
    const records = makeCyclingRecords(3600, { baseHr: 150 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 50);

    expect(result).toBeDefined();
    expect(result?.aerobic).toBeGreaterThan(0);
  });

  it('short session produces lower TE than long session at same intensity', () => {
    const short = makeRunningRecords(600, { baseHr: 155 });
    const long = makeRunningRecords(3600, { baseHr: 155 });

    const shortTE = calculateTrainingEffect(short, 190, 50, 'male', 0);
    const longTE = calculateTrainingEffect(long, 190, 50, 'male', 0);

    expect(shortTE).toBeDefined();
    expect(longTE).toBeDefined();
    if (!shortTE || !longTE) return;
    expect(shortTE.aerobic).toBeLessThan(longTE.aerobic);
  });

  it('results are rounded to 1 decimal place', () => {
    const records = makeRunningRecords(3600, { baseHr: 155 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result?.aerobic.toString()).toMatch(/^\d+(\.\d)?$/);
    expect(result?.anaerobic.toString()).toMatch(/^\d+(\.\d)?$/);
  });

  describe('calibration regression — aerobic TE vs Garmin ranges', () => {
    // All tests: male, maxHr=190, restHr=50
    const maxHr = 190;
    const restHr = 50;

    it('30-min easy run (baseHr≈100) at CTL=50 → TE 1.5–2.5', () => {
      const records = makeRunningRecords(1800, { baseHr: 100 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 50);
      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThanOrEqual(1.5);
      expect(result?.aerobic).toBeLessThanOrEqual(2.5);
    });

    it('1-hr easy run (baseHr≈145) at CTL=0 → TE 2.0–3.5', () => {
      const records = makeRunningRecords(3600, { baseHr: 145 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThanOrEqual(2.0);
      expect(result?.aerobic).toBeLessThanOrEqual(3.5);
    });

    it('1-hr moderate run (baseHr≈155) at CTL=50 → TE 2.5–3.5', () => {
      const records = makeRunningRecords(3600, { baseHr: 155 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 50);
      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThanOrEqual(2.5);
      expect(result?.aerobic).toBeLessThanOrEqual(3.5);
    });

    it('1-hr tempo run (baseHr≈170) at CTL=0 → TE 3.0–4.5', () => {
      const records = makeRunningRecords(3600, { baseHr: 170 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThanOrEqual(3.0);
      expect(result?.aerobic).toBeLessThanOrEqual(4.5);
    });

    it('higher CTL reduces TE but not drastically (power-law softens scaling)', () => {
      const records = makeRunningRecords(3600, { baseHr: 155 });
      const ctl0 = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      const ctl100 = calculateTrainingEffect(records, maxHr, restHr, 'male', 100);
      expect(ctl0).toBeDefined();
      expect(ctl100).toBeDefined();
      if (!ctl0 || !ctl100) return;
      // CTL=100 should reduce TE but by less than 33%
      const reduction = 1 - ctl100.aerobic / ctl0.aerobic;
      expect(reduction).toBeGreaterThan(0);
      expect(reduction).toBeLessThan(0.33);
    });
  });

  describe('calibration regression — anaerobic TE', () => {
    it('10-min intervals at HRR≈0.96 at CTL=0 → anaerobic TE 2.5–4.5', () => {
      // Constant HR=185 → HRR≈0.96 with maxHr=190, restHr=50.
      // Using fixed HR for determinism (random-walk HR can dip below VT2 threshold).
      const records: SessionRecord[] = Array.from({ length: 600 }, (_, i) => ({
        sessionId: 's1',
        timestamp: i,
        hr: 185,
      }));
      const result = calculateTrainingEffect(records, 190, 50, 'male', 0);
      expect(result).toBeDefined();
      expect(result?.anaerobic).toBeGreaterThanOrEqual(2.5);
      expect(result?.anaerobic).toBeLessThanOrEqual(4.5);
    });
  });
});

describe('getTrainingEffectLabel', () => {
  it('maps 0–0.9 to no_effect (neutral)', () => {
    expect(getTrainingEffectLabel(0)).toEqual({ label: 'no_effect', color: 'neutral' });
    expect(getTrainingEffectLabel(0.9)).toEqual({ label: 'no_effect', color: 'neutral' });
  });

  it('maps 1.0–1.9 to minor (blue)', () => {
    expect(getTrainingEffectLabel(1.0)).toEqual({ label: 'minor', color: 'blue' });
    expect(getTrainingEffectLabel(1.9)).toEqual({ label: 'minor', color: 'blue' });
  });

  it('maps 2.0–2.9 to maintaining (green)', () => {
    expect(getTrainingEffectLabel(2.0)).toEqual({ label: 'maintaining', color: 'green' });
    expect(getTrainingEffectLabel(2.9)).toEqual({ label: 'maintaining', color: 'green' });
  });

  it('maps 3.0–3.9 to improving (amber)', () => {
    expect(getTrainingEffectLabel(3.0)).toEqual({ label: 'improving', color: 'amber' });
    expect(getTrainingEffectLabel(3.9)).toEqual({ label: 'improving', color: 'amber' });
  });

  it('maps 4.0–4.9 to highly_improving (orange)', () => {
    expect(getTrainingEffectLabel(4.0)).toEqual({ label: 'highly_improving', color: 'orange' });
    expect(getTrainingEffectLabel(4.9)).toEqual({ label: 'highly_improving', color: 'orange' });
  });

  it('maps 5.0 to overreaching (red)', () => {
    expect(getTrainingEffectLabel(5.0)).toEqual({ label: 'overreaching', color: 'red' });
  });
});

describe('getTrainingEffectSummary', () => {
  it('returns too_easy key when both are below 1', () => {
    expect(getTrainingEffectSummary(0.5, 0.5)).toBe('too_easy');
  });

  it('returns extreme key when both are >= 4', () => {
    expect(getTrainingEffectSummary(4.0, 4.0)).toBe('extreme');
  });

  it('returns steady_aerobic key for steady effort', () => {
    expect(getTrainingEffectSummary(3.5, 1.0)).toBe('steady_aerobic');
  });

  it('returns high_intensity key for high-intensity session', () => {
    expect(getTrainingEffectSummary(1.5, 3.5)).toBe('high_intensity');
  });

  it('returns mixed_intensity key for balanced effort', () => {
    expect(getTrainingEffectSummary(3.0, 2.5)).toBe('mixed_intensity');
  });

  it('returns easy_maintenance key for moderate aerobic', () => {
    expect(getTrainingEffectSummary(2.5, 0.5)).toBe('easy_maintenance');
  });
});
