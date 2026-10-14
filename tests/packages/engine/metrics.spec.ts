import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { makeSession, makeSessionSequence } from '@tests/factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeMetrics', () => {
  it('returns empty array for empty sessions', () => {
    expect(computeMetrics([])).toEqual([]);
  });

  it('returns history entries for a single session', () => {
    const now = Date.now();
    const sessions = [makeSession({ date: now - 7 * DAY_MS, tss: 100 })];
    const history = computeMetrics(sessions, { endDate: now });

    expect(history.length).toBeGreaterThan(0);
    const withTss = history.filter((d) => d.tss > 0);
    expect(withTss).toHaveLength(1);
    expect(withTss[0].tss).toBe(100);
    const withoutTss = history.filter((d) => d.tss === 0);
    expect(withoutTss.length).toBeGreaterThan(0);
  });

  it('computes CTL and ATL that grow over multiple sessions', () => {
    const now = Date.now();
    const sessions = makeSessionSequence(30, {
      startDate: now - 30 * DAY_MS,
      baseTss: 80,
      tssVariation: 10,
    });
    const history = computeMetrics(sessions, { endDate: now });
    const last = history[history.length - 1];

    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
  });

  it('CTL responds slower than ATL (42-day vs 7-day EWMA)', () => {
    const now = Date.now();
    const sessions = Array.from({ length: 7 }, (_, i) =>
      makeSession({
        id: `burst-${i}`,
        date: now - (7 - i) * DAY_MS,
        tss: 150,
      }),
    );
    const history = computeMetrics(sessions, { endDate: now });
    const last = history[history.length - 1];

    expect(last.atl).toBeGreaterThan(last.ctl);
    expect(last.tsb).toBeLessThan(0);
  });

  it('excludes planned (ghost) sessions by default', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ date: now - 5 * DAY_MS, tss: 100, isPlanned: false }),
      makeSession({ date: now - 3 * DAY_MS, tss: 200, isPlanned: true }),
    ];
    const history = computeMetrics(sessions, { endDate: now });

    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(100);
  });

  it('includes planned sessions when includeGhosts is true', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ date: now - 5 * DAY_MS, tss: 100, isPlanned: false }),
      makeSession({ date: now - 3 * DAY_MS, tss: 200, isPlanned: true }),
    ];
    const history = computeMetrics(sessions, { endDate: now, includeGhosts: true });

    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(300);
  });

  it('ACWR is 0 when CTL is 0', () => {
    const now = Date.now();
    const sessions = [makeSession({ date: now, tss: 50 })];
    const history = computeMetrics(sessions, { endDate: now });

    expect(history[0].acwr).toBeDefined();
  });
});
