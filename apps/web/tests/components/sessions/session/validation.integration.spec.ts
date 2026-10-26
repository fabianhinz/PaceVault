import { describe, it, expect } from 'vite-plus/test';
import { validateRecords } from '@/components/sessions/session/validation.ts';
import { normalizedPowerFromRecords } from '@pacevault/engine/normalizedEffort.ts';
import { stressFromRecords } from '@pacevault/engine/stress.ts';
import {
  cyclingRecordSeries,
  runningRecordSeries,
  invalidRecordSeries,
} from '@pacevault/testing/series.ts';

const thresholds = (ftp?: number) => ({ restHr: 50, maxHr: 190, gender: 'male' as const, ftp });

describe('stress pipeline: records → validate → NP → TSS/TRIMP', () => {
  it('full cycling pipeline: 3600 records → TSS ~100 for IF ~1.0', () => {
    const records = cyclingRecordSeries({ count: 3600, basePowerWatts: 250 });

    // Validate — should be clean
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toHaveLength(0);

    // NP — random-walk power around 250W, NP ≈ average (low variability keeps NP close)
    const np = normalizedPowerFromRecords(records);
    expect(np).toBeDefined();
    expect(np ?? 0).toBeGreaterThan(230);

    // Full stress pipeline with FTP=250 and IF close to 1.0
    const result = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: 3600, avgHr: 150 },
      thresholds: thresholds(250),
    });
    expect(result.stressMethod).toBe('tss');
    expect(result.normalizedPower).toBe(np);
    expect(result.tss).toBeGreaterThanOrEqual(80);
    expect(result.tss).toBeLessThanOrEqual(150);
  });

  it('falls back to TRIMP when no power data', () => {
    const records = cyclingRecordSeries({ count: 3600 }).map((r) => ({
      ...r,
      power: undefined,
    }));

    const result = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: 3600, avgHr: 150 },
      thresholds: thresholds(250),
    });
    expect(result.stressMethod).toBe('trimp');
    expect(result.normalizedPower).toBeUndefined();
    expect(result.tss).toBeGreaterThan(0);
  });

  it('running pipeline uses TRIMP (no FTP)', () => {
    const records = runningRecordSeries({ count: 3600 });

    const result = stressFromRecords({
      sport: 'running',
      records,
      summary: { durationSec: 3600, avgHr: 155 },
      thresholds: thresholds(),
    });
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(0);
  });

  it('validation warns about power spikes but keeps them as recorded', () => {
    const goodRecords = cyclingRecordSeries({ count: 3600, basePowerWatts: 200 });
    const badRecords = invalidRecordSeries('highPower');
    const combined = [...goodRecords, ...badRecords];

    const warnings = validateRecords({ records: combined, sport: 'cycling' });
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'power_above_max' }));

    const npWithSpikes = normalizedPowerFromRecords(combined) ?? 0;
    expect(npWithSpikes).toBeGreaterThan(normalizedPowerFromRecords(goodRecords) ?? 0);
  });

  it('short session (< 30 records) → no NP, graceful fallback', () => {
    const records = cyclingRecordSeries({ count: 20 });

    const np = normalizedPowerFromRecords(records);
    expect(np).toBeUndefined();

    // stressFromRecords falls back to TRIMP when NP is unavailable
    const result = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: 20, avgHr: 150 },
      thresholds: thresholds(250),
    });
    expect(result.stressMethod).toBe('trimp');
  });

  it('duration fallback labeled as "duration", not "trimp"', () => {
    const records = cyclingRecordSeries({ count: 3600 }).map((r) => ({
      ...r,
      power: undefined,
      hr: undefined,
    }));
    // No power, no HR records and no avgHr → triggers duration fallback
    const result = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: 3600 },
      thresholds: thresholds(),
    });
    expect(result.stressMethod).toBe('duration');
    expect(result.tss).toBe(30); // 1 hour × 30 TSS/hour
  });

  it('TRIMP at threshold HR produces TSS ~100 for 1 hour', () => {
    const restHr = 50;
    const maxHr = 190;
    // avgHr at 88% HRR: 50 + 0.88 * 140 = 173.2
    const avgHr = restHr + 0.88 * (maxHr - restHr);
    // No power → falls back to TRIMP per record
    const records = cyclingRecordSeries({ count: 3600 }).map((r) => ({
      ...r,
      power: undefined,
      hr: avgHr,
    }));
    const result = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: 3600, avgHr },
      thresholds: thresholds(),
    });
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(85);
    expect(result.tss).toBeLessThan(115);
  });
});
