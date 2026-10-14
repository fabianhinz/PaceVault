import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { makeSession } from '@tests/factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('EWMA alpha matches Coggan PMC model', () => {
  it('CTL after 42 days constant TSS=50 matches 1-exp(-1/42) formula', () => {
    const now = Date.now();
    const sessions = Array.from({ length: 42 }, (_, i) =>
      makeSession({
        id: `day-${i}`,
        date: now - (42 - i) * DAY_MS,
        tss: 50,
      }),
    );

    const metrics = computeMetrics(sessions, { endDate: now - 1 * DAY_MS });
    const last = metrics[metrics.length - 1];

    // Coggan alpha for CTL: 1 - exp(-1/42) ≈ 0.02353
    // After 42 days of TSS=50: CTL = 50 * (1 - (1 - 0.02353)^42)
    //                                = 50 * (1 - exp(-42/42))
    //                                = 50 * (1 - 1/e)
    //                                ≈ 50 * 0.6321 ≈ 31.6
    expect(last.ctl).toBeCloseTo(31.6, 0);
  });

  it('ATL after 7 days constant TSS=100 matches 1-exp(-1/7) formula', () => {
    const now = Date.now();
    const sessions = Array.from({ length: 7 }, (_, i) =>
      makeSession({
        id: `day-${i}`,
        date: now - (7 - i) * DAY_MS,
        tss: 100,
      }),
    );

    const metrics = computeMetrics(sessions, { endDate: now - 1 * DAY_MS });
    const last = metrics[metrics.length - 1];

    // Coggan alpha for ATL: 1 - exp(-1/7) ≈ 0.1331
    // After 7 days of TSS=100: ATL = 100 * (1 - (1 - 0.1331)^7)
    //                               = 100 * (1 - exp(-7/7))
    //                               = 100 * (1 - 1/e)
    //                               ≈ 100 * 0.6321 ≈ 63.2
    expect(last.atl).toBeCloseTo(63.2, 0);
  });

  it('alpha is NOT the financial 2/(n+1) formula', () => {
    const now = Date.now();
    const sessions = [makeSession({ id: 'single', date: now - 1 * DAY_MS, tss: 100 })];

    const metrics = computeMetrics(sessions, { endDate: now - 1 * DAY_MS });
    const last = metrics[metrics.length - 1];

    // With Coggan alpha for ATL: 1 - exp(-1/7) ≈ 0.1331
    // Single day: ATL = 0 + (100 - 0) * 0.1331 ≈ 13.3
    // With financial alpha: 2/(7+1) = 0.25 → ATL would be 25.0
    expect(last.atl).toBeCloseTo(13.3, 0);
    // Verify it's NOT the financial formula
    expect(last.atl).not.toBeCloseTo(25.0, 0);
  });
});
