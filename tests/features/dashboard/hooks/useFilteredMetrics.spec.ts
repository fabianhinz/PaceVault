import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { makeSession } from '../../../factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('useFilteredMetrics — filtering sessions before computeMetrics', () => {
  it('filtering by sport reduces total TSS in history', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ id: 'c1', sport: 'cycling', date: now - 3 * DAY_MS, tss: 100 }),
      makeSession({ id: 'r1', sport: 'running', date: now - 2 * DAY_MS, tss: 80 }),
      makeSession({ id: 'c2', sport: 'cycling', date: now - 1 * DAY_MS, tss: 120 }),
    ];

    const allHistory = computeMetrics(sessions, { endDate: now });
    const allTss = allHistory.reduce((sum, d) => sum + d.tss, 0);

    const cyclingOnly = sessions.filter((s) => s.sport === 'cycling');
    const cyclingHistory = computeMetrics(cyclingOnly, { endDate: now });
    const cyclingTss = cyclingHistory.reduce((sum, d) => sum + d.tss, 0);

    expect(cyclingTss).toBeLessThan(allTss);
    expect(cyclingTss).toBe(220);
  });

  it('filtering to a sport with no sessions returns empty history', () => {
    const now = Date.now();
    const sessions = [makeSession({ id: 'r1', sport: 'running', date: now - 1 * DAY_MS, tss: 80 })];

    const cyclingOnly = sessions.filter((s) => s.sport === 'cycling');
    const history = computeMetrics(cyclingOnly, { endDate: now });

    expect(history).toEqual([]);
  });

  it("'all' filter produces the same result as unfiltered", () => {
    const now = Date.now();
    const sessions = [
      makeSession({ id: 'c1', sport: 'cycling', date: now - 3 * DAY_MS, tss: 100 }),
      makeSession({ id: 'r1', sport: 'running', date: now - 2 * DAY_MS, tss: 80 }),
      makeSession({ id: 'r2', sport: 'running', date: now - 1 * DAY_MS, tss: 60 }),
    ];

    const allHistory = computeMetrics(sessions, { endDate: now });
    // "all" means no filtering
    const filteredHistory = computeMetrics(sessions, { endDate: now });

    expect(filteredHistory).toEqual(allHistory);
  });

  it('single-sport filter produces correct CTL/ATL values', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ id: 'r1', sport: 'running', date: now - 5 * DAY_MS, tss: 60 }),
      makeSession({ id: 'c1', sport: 'cycling', date: now - 4 * DAY_MS, tss: 150 }),
      makeSession({ id: 'r2', sport: 'running', date: now - 3 * DAY_MS, tss: 70 }),
      makeSession({ id: 'c2', sport: 'cycling', date: now - 2 * DAY_MS, tss: 200 }),
      makeSession({ id: 'r3', sport: 'running', date: now - 1 * DAY_MS, tss: 55 }),
    ];

    const runningOnly = sessions.filter((s) => s.sport === 'running');
    const runningHistory = computeMetrics(runningOnly, { endDate: now });
    const lastRunning = runningHistory[runningHistory.length - 1];

    const allHistory = computeMetrics(sessions, { endDate: now });
    const lastAll = allHistory[allHistory.length - 1];

    // Running-only CTL/ATL should be lower since cycling had higher TSS
    expect(lastRunning.ctl).toBeLessThan(lastAll.ctl);
    expect(lastRunning.atl).toBeLessThan(lastAll.atl);
  });
});
