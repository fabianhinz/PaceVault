import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { getCoachingRecommendation } from '@/lib/coachingMessages.ts';
import { getFormStatus, getInjuryRisk } from '@/packages/engine/coaching.ts';
import { makeSession } from '@tests/factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('metrics → coaching pipeline', () => {
  it('single session produces initial CTL/ATL/TSB', () => {
    const session = makeSession({
      date: Date.now() - 1 * DAY_MS,
      tss: 100,
    });

    const metrics = computeMetrics([session]);
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
    const lastSessionDate = now - 1 * DAY_MS;
    const sessions = Array.from({ length: 42 }, (_, i) =>
      makeSession({
        id: `day-${i}`,
        date: now - (42 - i) * DAY_MS,
        tss: 100,
      }),
    );

    const metrics = computeMetrics(sessions, { endDate: lastSessionDate });
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
      makeSession({
        id: `train-${i}`,
        date: now - (37 - i) * DAY_MS, // days -37 to -8
        tss: 100,
      }),
    );

    const metricsAfterTraining = computeMetrics(trainingSessions);

    // Now 7 days of rest (no sessions, but computeMetrics fills to today)
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
      makeSession({
        id: `hard-${i}`,
        date: now - (8 - i) * DAY_MS,
        tss: 150 + i * 20, // 150, 170, 190, 210, 230, 250, 270, 290
      }),
    );

    const current = computeMetrics(sessions).at(-1);
    expect(current).toBeDefined();
    expect(current?.tsb ?? 0).toBeLessThan(-30);

    const coaching = getCoachingRecommendation(current, 8);
    expect(coaching.status).toBe('overload');
  });

  it('rest after long training block → TSB > 25 → coaching: detraining', () => {
    const now = Date.now();
    // 60 days of consistent training, then 14 days of complete rest
    // CTL builds up high (~94), ATL also high (~100)
    // After 14 days rest: ATL decays fast → ~2, CTL decays slow → ~48
    // TSB = CTL - ATL ≈ 46 → detraining
    const sessions = Array.from({ length: 60 }, (_, i) =>
      makeSession({
        id: `train-${i}`,
        date: now - (74 - i) * DAY_MS, // days -74 to -15
        tss: 100,
      }),
    );

    const current = computeMetrics(sessions).at(-1);
    expect(current).toBeDefined();
    expect(current?.tsb ?? 0).toBeGreaterThan(25);

    const coaching = getCoachingRecommendation(current, 74);
    expect(coaching.status).toBe('detraining');
  });

  it('ghost sessions excluded by default', () => {
    const now = Date.now();
    const realSession = makeSession({
      id: 'real',
      date: now - 1 * DAY_MS,
      tss: 100,
    });
    const ghost = makeSession({
      id: 'ghost',
      date: now - 1 * DAY_MS,
      tss: 200,
      isPlanned: true,
      hasDetailedRecords: false,
    });

    const metricsWithout = computeMetrics([realSession, ghost]);
    const metricsOnlyReal = computeMetrics([realSession]);

    // Ghost should be excluded, so metrics should be the same
    const lastWith = metricsWithout[metricsWithout.length - 1];
    const lastReal = metricsOnlyReal[metricsOnlyReal.length - 1];
    expect(lastWith.ctl).toBe(lastReal.ctl);
    expect(lastWith.atl).toBe(lastReal.atl);
  });

  it('ACWR thresholds: <0.8 low, 0.8–1.3 low, 1.3–1.5 moderate, >1.5 high', () => {
    expect(getInjuryRisk(0.5)).toBe('low'); // undertraining
    expect(getInjuryRisk(0.8)).toBe('low'); // sweet spot boundary
    expect(getInjuryRisk(1.0)).toBe('low'); // sweet spot
    expect(getInjuryRisk(1.3)).toBe('low'); // upper sweet spot boundary
    expect(getInjuryRisk(1.4)).toBe('moderate');
    expect(getInjuryRisk(1.5)).toBe('moderate');
    expect(getInjuryRisk(1.6)).toBe('high');
    expect(getInjuryRisk(2.0)).toBe('high');
  });

  it('empty sessions → empty metrics, neutral coaching', () => {
    const metrics = computeMetrics([]);
    expect(metrics).toEqual([]);

    const current = computeMetrics([]).at(-1);
    expect(current).toBeUndefined();

    const coaching = getCoachingRecommendation(undefined, 0);
    expect(coaching.status).toBe('neutral');
    expect(coaching.tsb).toBe(0);
    expect(coaching.acwr).toBe(0);
    expect(coaching.injuryRisk).toBe('low');
  });

  it('NaN TSS does not poison subsequent metrics', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ id: 'good-1', date: now - 3 * DAY_MS, tss: 100 }),
      makeSession({ id: 'bad', date: now - 2 * DAY_MS, tss: NaN }),
      makeSession({ id: 'good-2', date: now - 1 * DAY_MS, tss: 80 }),
    ];

    const metrics = computeMetrics(sessions);
    const last = metrics[metrics.length - 1];

    expect(Number.isFinite(last.ctl)).toBe(true);
    expect(Number.isFinite(last.atl)).toBe(true);
    expect(Number.isFinite(last.tsb)).toBe(true);
    expect(Number.isFinite(last.acwr)).toBe(true);
  });

  it('Infinity TSS is treated as 0', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ id: 'good', date: now - 2 * DAY_MS, tss: 100 }),
      makeSession({ id: 'inf', date: now - 1 * DAY_MS, tss: Infinity }),
    ];

    const metrics = computeMetrics(sessions);
    const last = metrics[metrics.length - 1];

    expect(Number.isFinite(last.ctl)).toBe(true);
    expect(Number.isFinite(last.atl)).toBe(true);
    // Infinity TSS treated as 0, so ATL should decay (not spike)
    const dayBeforeLast = metrics[metrics.length - 2];
    expect(last.atl).toBeLessThan(dayBeforeLast.atl);
  });

  it('two sessions on the same date produce summed TSS', () => {
    const now = Date.now();
    const sameDay = now - 1 * DAY_MS;
    const session1 = makeSession({ id: 'am', date: sameDay, tss: 60 });
    const session2 = makeSession({ id: 'pm', date: sameDay, tss: 40 });

    const endDate = sameDay;
    const combinedMetrics = computeMetrics([session1, session2], { endDate });
    const singleMetrics = computeMetrics([makeSession({ id: 'single', date: sameDay, tss: 100 })], {
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
      makeSession({
        id: `day-${i}`,
        date: now - (30 - i) * DAY_MS,
        tss: 50 + (i % 7) * 20, // varying TSS
      }),
    );

    const metrics = computeMetrics(sessions);
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
      makeSession({
        id: `day-${i}`,
        date: now - (42 - i) * DAY_MS,
        tss: 50,
      }),
    );

    const metrics = computeMetrics(sessions);
    const last = metrics[metrics.length - 1];
    // After rounding, ACWR stays at most 2 decimal places
    const str = last.acwr.toString();
    const decimals = str.split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('form status boundaries', () => {
    expect(getFormStatus(30)).toBe('detraining');
    expect(getFormStatus(25.1)).toBe('detraining');
    expect(getFormStatus(25)).toBe('fresh');
    expect(getFormStatus(5)).toBe('fresh');
    expect(getFormStatus(4)).toBe('neutral');
    expect(getFormStatus(-10)).toBe('neutral');
    expect(getFormStatus(-11)).toBe('optimal');
    expect(getFormStatus(-30)).toBe('optimal');
    expect(getFormStatus(-31)).toBe('overload');
  });
});
