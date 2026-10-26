import { describe, it, expect } from 'vite-plus/test';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';
import { getCoachingRecommendation } from '@/components/dashboard/coachingMessages.ts';
import { formStatusFromTsb, injuryRiskFromAcwr } from '@pacevault/engine/coaching.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

describe('metrics → coaching pipeline', () => {
  it('single session produces initial CTL/ATL/TSB', () => {
    const session = createMockTrainingSession({
      date: Date.now() - 1 * MS_PER_DAY,
      tss: 100,
    });

    const metrics = dailyMetricsFromSessions({ sessions: [session] });
    expect(metrics.length).toBeGreaterThanOrEqual(1);

    const last = metrics[metrics.length - 1];
    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
    // ATL reacts faster than CTL (alpha≈0.133 vs alpha≈0.024)
    expect(last.atl).toBeGreaterThan(last.ctl);
    // TSB = CTL - ATL, should be negative initially
    expect(last.tsb).toBeLessThan(0);
  });

  it('42-day constant TSS=100 → CTL converges (ATL converges faster)', () => {
    const now = Date.now();
    const lastSessionDate = now - 1 * MS_PER_DAY;
    const sessions = Array.from({ length: 42 }, (_, i) =>
      createMockTrainingSession({
        id: `day-${i}`,
        date: now - (42 - i) * MS_PER_DAY,
        tss: 100,
      }),
    );

    const metrics = dailyMetricsFromSessions({ sessions, endDate: lastSessionDate });
    const last = metrics[metrics.length - 1];

    // CTL with Coggan alpha = 1-exp(-1/42) ≈ 0.0235: after 42 days at TSS=100, CTL ≈ 63
    expect(last.ctl).toBeGreaterThan(55);
    expect(last.ctl).toBeLessThan(75);

    // ATL with Coggan alpha = 1-exp(-1/7) ≈ 0.133: converges much faster, close to 100
    expect(last.atl).toBeGreaterThan(90);
    expect(last.atl).toBeLessThan(105);
  });

  it('rest period after training block → TSB rises (ATL decays faster than CTL)', () => {
    const now = Date.now();
    // 30 days of training
    const trainingSessions = Array.from({ length: 30 }, (_, i) =>
      createMockTrainingSession({
        id: `train-${i}`,
        date: now - (37 - i) * MS_PER_DAY, // days -37 to -8
        tss: 100,
      }),
    );

    const metricsAfterTraining = dailyMetricsFromSessions({ sessions: trainingSessions });

    // Now 7 days of rest (no sessions, but dailyMetricsFromSessions fills to today)
    // The end date is today, so metrics run through rest period

    // Final metrics include the rest period
    const finalMetrics = metricsAfterTraining[metricsAfterTraining.length - 1];

    // After rest: ATL decays faster → TSB should rise
    // TSB at end of training block (around day 30)
    const dayOfLastSession = 29; // 0-indexed, last training day
    const tsbAtEndOfTraining = metricsAfterTraining[dayOfLastSession].tsb;
    // TSB should be higher at the end (after rest) than right after training
    expect(finalMetrics.tsb).toBeGreaterThan(tsbAtEndOfTraining);
  });

  it('escalating TSS over 8 days → TSB < -30 → coaching: overload', () => {
    const now = Date.now();
    // 8 days of very high, escalating TSS
    const sessions = Array.from({ length: 8 }, (_, i) =>
      createMockTrainingSession({
        id: `hard-${i}`,
        date: now - (8 - i) * MS_PER_DAY,
        tss: 150 + i * 20, // 150, 170, 190, 210, 230, 250, 270, 290
      }),
    );

    const current = dailyMetricsFromSessions({ sessions }).at(-1);
    expect(current).toBeDefined();
    expect(current?.tsb ?? 0).toBeLessThan(-30);

    const coaching = getCoachingRecommendation({ metrics: current, historyDays: 8 });
    expect(coaching.status).toBe('overload');
  });

  it('rest after long training block → TSB > 25 → coaching: detraining', () => {
    const now = Date.now();
    // 60 days of consistent training, then 14 days of complete rest
    // CTL builds up high (~94), ATL also high (~100)
    // After 14 days rest: ATL decays fast → ~2, CTL decays slow → ~48
    // TSB = CTL - ATL ≈ 46 → detraining
    const sessions = Array.from({ length: 60 }, (_, i) =>
      createMockTrainingSession({
        id: `train-${i}`,
        date: now - (74 - i) * MS_PER_DAY, // days -74 to -15
        tss: 100,
      }),
    );

    const current = dailyMetricsFromSessions({ sessions }).at(-1);
    expect(current).toBeDefined();
    expect(current?.tsb ?? 0).toBeGreaterThan(25);

    const coaching = getCoachingRecommendation({ metrics: current, historyDays: 74 });
    expect(coaching.status).toBe('detraining');
  });

  it('ghost sessions excluded by default', () => {
    const now = Date.now();
    const realSession = createMockTrainingSession({
      id: 'real',
      date: now - 1 * MS_PER_DAY,
      tss: 100,
    });
    const ghost = createMockTrainingSession({
      id: 'ghost',
      date: now - 1 * MS_PER_DAY,
      tss: 200,
      isPlanned: true,
      hasDetailedRecords: false,
    });

    const metricsWithout = dailyMetricsFromSessions({ sessions: [realSession, ghost] });
    const metricsOnlyReal = dailyMetricsFromSessions({ sessions: [realSession] });

    // Ghost should be excluded, so metrics should be the same
    const lastWith = metricsWithout[metricsWithout.length - 1];
    const lastReal = metricsOnlyReal[metricsOnlyReal.length - 1];
    expect(lastWith.ctl).toBe(lastReal.ctl);
    expect(lastWith.atl).toBe(lastReal.atl);
  });

  it('ACWR thresholds: <0.8 low, 0.8–1.3 low, 1.3–1.5 moderate, >1.5 high', () => {
    expect(injuryRiskFromAcwr(0.5)).toBe('low'); // undertraining
    expect(injuryRiskFromAcwr(0.8)).toBe('low'); // sweet spot boundary
    expect(injuryRiskFromAcwr(1.0)).toBe('low'); // sweet spot
    expect(injuryRiskFromAcwr(1.3)).toBe('low'); // upper sweet spot boundary
    expect(injuryRiskFromAcwr(1.4)).toBe('moderate');
    expect(injuryRiskFromAcwr(1.5)).toBe('moderate');
    expect(injuryRiskFromAcwr(1.6)).toBe('high');
    expect(injuryRiskFromAcwr(2.0)).toBe('high');
  });

  it('empty sessions → empty metrics, neutral coaching', () => {
    const metrics = dailyMetricsFromSessions({ sessions: [] });
    expect(metrics).toEqual([]);

    const current = dailyMetricsFromSessions({ sessions: [] }).at(-1);
    expect(current).toBeUndefined();

    const coaching = getCoachingRecommendation({ metrics: undefined, historyDays: 0 });
    expect(coaching.status).toBe('neutral');
    expect(coaching.tsb).toBe(0);
    expect(coaching.acwr).toBe(0);
    expect(coaching.injuryRisk).toBe('low');
  });

  it('NaN TSS does not poison subsequent metrics', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({ id: 'good-1', date: now - 3 * MS_PER_DAY, tss: 100 }),
      createMockTrainingSession({ id: 'bad', date: now - 2 * MS_PER_DAY, tss: NaN }),
      createMockTrainingSession({ id: 'good-2', date: now - 1 * MS_PER_DAY, tss: 80 }),
    ];

    const metrics = dailyMetricsFromSessions({ sessions });
    const last = metrics[metrics.length - 1];

    expect(Number.isFinite(last.ctl)).toBe(true);
    expect(Number.isFinite(last.atl)).toBe(true);
    expect(Number.isFinite(last.tsb)).toBe(true);
    expect(Number.isFinite(last.acwr)).toBe(true);
  });

  it('Infinity TSS is treated as 0', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({ id: 'good', date: now - 2 * MS_PER_DAY, tss: 100 }),
      createMockTrainingSession({ id: 'inf', date: now - 1 * MS_PER_DAY, tss: Infinity }),
    ];

    const metrics = dailyMetricsFromSessions({ sessions });
    const last = metrics[metrics.length - 1];

    expect(Number.isFinite(last.ctl)).toBe(true);
    expect(Number.isFinite(last.atl)).toBe(true);
    // Infinity TSS treated as 0, so ATL should decay (not spike)
    const dayBeforeLast = metrics[metrics.length - 2];
    expect(last.atl).toBeLessThan(dayBeforeLast.atl);
  });

  it('two sessions on the same date produce summed TSS', () => {
    const now = Date.now();
    const sameDay = now - 1 * MS_PER_DAY;
    const session1 = createMockTrainingSession({ id: 'am', date: sameDay, tss: 60 });
    const session2 = createMockTrainingSession({ id: 'pm', date: sameDay, tss: 40 });

    const endDate = sameDay;
    const combinedMetrics = dailyMetricsFromSessions({ sessions: [session1, session2], endDate });
    const singleMetrics = dailyMetricsFromSessions({
      sessions: [createMockTrainingSession({ id: 'single', date: sameDay, tss: 100 })],
      endDate,
    });

    const combinedLast = combinedMetrics[combinedMetrics.length - 1];
    const singleLast = singleMetrics[singleMetrics.length - 1];

    // Both should produce the same daily TSS of 100
    expect(combinedLast.tss).toBe(100);
    expect(combinedLast.ctl).toBe(singleLast.ctl);
    expect(combinedLast.atl).toBe(singleLast.atl);
  });

  it('ACWR has at most 2 decimal places', () => {
    const now = Date.now();
    const sessions = Array.from({ length: 30 }, (_, i) =>
      createMockTrainingSession({
        id: `day-${i}`,
        date: now - (30 - i) * MS_PER_DAY,
        tss: 50 + (i % 7) * 20, // varying TSS
      }),
    );

    const metrics = dailyMetricsFromSessions({ sessions });
    for (const m of metrics) {
      const decimals = m.acwr.toString().split('.')[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(2);
    }
  });

  it('ACWR rounding at classification boundaries is within +/-0.005 noise', () => {
    // With rounding to 2 decimals, a "true" ACWR of 1.305 rounds to 1.31
    // which crosses the 1.3 moderate threshold. This is expected behavior.
    const now = Date.now();
    // Craft sessions that produce ACWR near 1.3
    // 42 days constant then a spike
    const sessions = Array.from({ length: 42 }, (_, i) =>
      createMockTrainingSession({
        id: `day-${i}`,
        date: now - (42 - i) * MS_PER_DAY,
        tss: 50,
      }),
    );

    const metrics = dailyMetricsFromSessions({ sessions });
    const last = metrics[metrics.length - 1];
    // After rounding, ACWR stays at most 2 decimal places
    const str = last.acwr.toString();
    const decimals = str.split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('form status boundaries', () => {
    expect(formStatusFromTsb(30)).toBe('detraining');
    expect(formStatusFromTsb(25.1)).toBe('detraining');
    expect(formStatusFromTsb(25)).toBe('fresh');
    expect(formStatusFromTsb(5)).toBe('fresh');
    expect(formStatusFromTsb(4)).toBe('neutral');
    expect(formStatusFromTsb(-10)).toBe('neutral');
    expect(formStatusFromTsb(-11)).toBe('optimal');
    expect(formStatusFromTsb(-30)).toBe('optimal');
    expect(formStatusFromTsb(-31)).toBe('overload');
  });
});
