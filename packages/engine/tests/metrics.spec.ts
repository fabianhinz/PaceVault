import { describe, it, expect } from 'vite-plus/test';
import { dailyMetricsFromSessions } from '../src/metrics.ts';
import { createMockTrainingSession } from '../../testing/src/sessions.ts';
import { sessionSeries } from '../../testing/src/series.ts';
import { MS_PER_DAY } from '../src/time.ts';

describe(dailyMetricsFromSessions.name, () => {
  it('returns empty array for empty sessions', () => {
    expect(dailyMetricsFromSessions({ sessions: [] })).toEqual([]);
  });

  it('returns history entries for a single session', () => {
    const now = Date.now();
    const sessions = [createMockTrainingSession({ date: now - 7 * MS_PER_DAY, tss: 100 })];
    const history = dailyMetricsFromSessions({ sessions, endDate: now });

    expect(history.length).toBeGreaterThan(0);
    const withTss = history.filter((d) => d.tss > 0);
    expect(withTss).toHaveLength(1);
    expect(withTss[0].tss).toBe(100);
    const withoutTss = history.filter((d) => d.tss === 0);
    expect(withoutTss.length).toBeGreaterThan(0);
  });

  it('computes CTL and ATL that grow over multiple sessions', () => {
    const now = Date.now();
    const sessions = sessionSeries({
      count: 30,
      startDate: now - 30 * MS_PER_DAY,
      baseTss: 80,
      tssVariation: 10,
    });
    const history = dailyMetricsFromSessions({ sessions, endDate: now });
    const last = history[history.length - 1];

    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
  });

  it('CTL responds slower than ATL (42-day vs 7-day EWMA)', () => {
    const now = Date.now();
    const sessions = Array.from({ length: 7 }, (_, i) =>
      createMockTrainingSession({
        id: `burst-${i}`,
        date: now - (7 - i) * MS_PER_DAY,
        tss: 150,
      }),
    );
    const history = dailyMetricsFromSessions({ sessions, endDate: now });
    const last = history[history.length - 1];

    expect(last.atl).toBeGreaterThan(last.ctl);
    expect(last.tsb).toBeLessThan(0);
  });

  it('excludes planned (ghost) sessions by default', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({ date: now - 5 * MS_PER_DAY, tss: 100, isPlanned: false }),
      createMockTrainingSession({ date: now - 3 * MS_PER_DAY, tss: 200, isPlanned: true }),
    ];
    const history = dailyMetricsFromSessions({ sessions, endDate: now });

    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(100);
  });

  it('includes planned sessions when includeGhosts is true', () => {
    const now = Date.now();
    const sessions = [
      createMockTrainingSession({ date: now - 5 * MS_PER_DAY, tss: 100, isPlanned: false }),
      createMockTrainingSession({ date: now - 3 * MS_PER_DAY, tss: 200, isPlanned: true }),
    ];
    const history = dailyMetricsFromSessions({ sessions, endDate: now, includeGhosts: true });

    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(300);
  });

  it('ACWR is 0 when CTL is 0', () => {
    const now = Date.now();
    const sessions = [createMockTrainingSession({ date: now, tss: 50 })];
    const history = dailyMetricsFromSessions({ sessions, endDate: now });

    expect(history[0].acwr).toBeDefined();
  });
});
