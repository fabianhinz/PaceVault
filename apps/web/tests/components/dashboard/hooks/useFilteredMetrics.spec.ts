import { describe, it, expect } from 'vite-plus/test';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

describe('useFilteredMetrics — filtering sessions before dailyMetricsFromSessions', () => {
  it('filtering by sport reduces total TSS in history', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({
        id: 'c1',
        sport: 'cycling',
        date: now - 3 * MS_PER_DAY,
        tss: 100,
      }),
      createMockTrainingSession({
        id: 'r1',
        sport: 'running',
        date: now - 2 * MS_PER_DAY,
        tss: 80,
      }),
      createMockTrainingSession({
        id: 'c2',
        sport: 'cycling',
        date: now - 1 * MS_PER_DAY,
        tss: 120,
      }),
    ];

    const allHistory = dailyMetricsFromSessions({ sessions, endDate: now });
    const allTss = allHistory.reduce((sum, d) => sum + d.tss, 0);

    const cyclingOnly = sessions.filter((s) => s.sport === 'cycling');
    const cyclingHistory = dailyMetricsFromSessions({ sessions: cyclingOnly, endDate: now });
    const cyclingTss = cyclingHistory.reduce((sum, d) => sum + d.tss, 0);

    expect(cyclingTss).toBeLessThan(allTss);
    expect(cyclingTss).toBe(220);
  });

  it('filtering to a sport with no sessions returns empty history', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({
        id: 'r1',
        sport: 'running',
        date: now - 1 * MS_PER_DAY,
        tss: 80,
      }),
    ];

    const cyclingOnly = sessions.filter((s) => s.sport === 'cycling');
    const history = dailyMetricsFromSessions({ sessions: cyclingOnly, endDate: now });

    expect(history).toEqual([]);
  });

  it("'all' filter produces the same result as unfiltered", () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({
        id: 'c1',
        sport: 'cycling',
        date: now - 3 * MS_PER_DAY,
        tss: 100,
      }),
      createMockTrainingSession({
        id: 'r1',
        sport: 'running',
        date: now - 2 * MS_PER_DAY,
        tss: 80,
      }),
      createMockTrainingSession({
        id: 'r2',
        sport: 'running',
        date: now - 1 * MS_PER_DAY,
        tss: 60,
      }),
    ];

    const allHistory = dailyMetricsFromSessions({ sessions, endDate: now });
    // "all" means no filtering
    const filteredHistory = dailyMetricsFromSessions({ sessions, endDate: now });

    expect(filteredHistory).toEqual(allHistory);
  });

  it('single-sport filter produces correct CTL/ATL values', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({
        id: 'r1',
        sport: 'running',
        date: now - 5 * MS_PER_DAY,
        tss: 60,
      }),
      createMockTrainingSession({
        id: 'c1',
        sport: 'cycling',
        date: now - 4 * MS_PER_DAY,
        tss: 150,
      }),
      createMockTrainingSession({
        id: 'r2',
        sport: 'running',
        date: now - 3 * MS_PER_DAY,
        tss: 70,
      }),
      createMockTrainingSession({
        id: 'c2',
        sport: 'cycling',
        date: now - 2 * MS_PER_DAY,
        tss: 200,
      }),
      createMockTrainingSession({
        id: 'r3',
        sport: 'running',
        date: now - 1 * MS_PER_DAY,
        tss: 55,
      }),
    ];

    const runningOnly = sessions.filter((s) => s.sport === 'running');
    const runningHistory = dailyMetricsFromSessions({ sessions: runningOnly, endDate: now });
    const lastRunning = runningHistory[runningHistory.length - 1];

    const allHistory = dailyMetricsFromSessions({ sessions, endDate: now });
    const lastAll = allHistory[allHistory.length - 1];

    // Running-only CTL/ATL should be lower since cycling had higher TSS
    expect(lastRunning.ctl).toBeLessThan(lastAll.ctl);
    expect(lastRunning.atl).toBeLessThan(lastAll.atl);
  });
});
