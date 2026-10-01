import { describe, it, expect } from 'vitest';
import { validateRecords, filterValidPower } from '@/lib/validation.ts';
import { calculateNormalizedPower } from '@/packages/engine/normalize.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import {
  makeCyclingRecords,
  makeRunningRecords,
  makeInvalidRecords,
} from '@tests/factories/records.ts';

describe('stress pipeline: records → validate → filter → NP → TSS/TRIMP', () => {
  it('full cycling pipeline: 3600 records → TSS ~100 for IF ~1.0', () => {
    const records = makeCyclingRecords(3600, { basePower: 250 });

    // Validate — should be clean
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toHaveLength(0);

    // Filter
    const validPower = filterValidPower(records);
    expect(validPower.length).toBe(3600);

    // NP — random-walk power around 250W, NP ≈ average (low variability keeps NP close)
    const np = calculateNormalizedPower(validPower);
    expect(np).toBeDefined();
    expect(np ?? 0).toBeGreaterThan(230);

    // Full stress pipeline with FTP=250 and IF close to 1.0
    const result = calculateSessionStress(validPower, 3600, 150, 50, 190, 'male', 250);
    expect(result.stressMethod).toBe('tss');
    expect(result.normalizedPower).toBe(np);
    expect(result.tss).toBeGreaterThanOrEqual(80);
    expect(result.tss).toBeLessThanOrEqual(150);
  });

  it('falls back to TRIMP when no power data', () => {
    const records = makeCyclingRecords(3600).map((r) => ({
      ...r,
      power: undefined,
    }));

    const result = calculateSessionStress(records, 3600, 150, 50, 190, 'male', 250);
    expect(result.stressMethod).toBe('trimp');
    expect(result.normalizedPower).toBeUndefined();
    expect(result.tss).toBeGreaterThan(0);
  });

  it('running pipeline uses TRIMP (no FTP)', () => {
    const records = makeRunningRecords(3600);

    const result = calculateSessionStress(records, 3600, 155, 50, 190, 'male');
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(0);
  });

  it('validation filters bad data before stress calculation', () => {
    const goodRecords = makeCyclingRecords(3600, { basePower: 200 });
    const badRecords = makeInvalidRecords('highPower');
    const combined = [...goodRecords, ...badRecords];

    // Validate detects issues
    const warnings = validateRecords(combined, 'cycling');
    expect(warnings.some((w) => w.field === 'power')).toBe(true);

    // After filtering, bad records removed
    const filtered = filterValidPower(combined);
    expect(filtered.length).toBe(goodRecords.length);
    expect(filtered.every((r) => (r.power ?? 0) <= 2500)).toBe(true);

    // NP still works on filtered data
    const np = calculateNormalizedPower(filtered);
    expect(np).toBeDefined();
  });

  it('short session (< 30 records) → no NP, graceful fallback', () => {
    const records = makeCyclingRecords(20);

    const np = calculateNormalizedPower(records);
    expect(np).toBeUndefined();

    // calculateSessionStress falls back to TRIMP when NP is unavailable
    const result = calculateSessionStress(records, 20, 150, 50, 190, 'male', 250);
    expect(result.stressMethod).toBe('trimp');
  });

  it('duration fallback labeled as "duration", not "trimp"', () => {
    const records = makeCyclingRecords(3600).map((r) => ({
      ...r,
      power: undefined,
    }));
    // No avgHr → triggers duration fallback
    const result = calculateSessionStress(records, 3600, undefined, 50, 190, 'male');
    expect(result.stressMethod).toBe('duration');
    expect(result.tss).toBe(30); // 1 hour × 30 TSS/hour
  });

  it('TRIMP at threshold HR produces TSS ~100 for 1 hour', () => {
    const restHr = 50;
    const maxHr = 190;
    // avgHr at 88% HRR: 50 + 0.88 * 140 = 173.2
    const avgHr = restHr + 0.88 * (maxHr - restHr);
    // No power → falls back to TRIMP
    const records = makeCyclingRecords(3600).map((r) => ({ ...r, power: undefined }));
    const result = calculateSessionStress(records, 3600, avgHr, restHr, maxHr, 'male');
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(85);
    expect(result.tss).toBeLessThan(115);
  });
});
