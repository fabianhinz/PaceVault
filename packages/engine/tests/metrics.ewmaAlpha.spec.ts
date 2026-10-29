import { describe, it, expect } from 'vite-plus/test';
import { dailyMetricsFromSessions } from '../src/metrics.ts';
import { createMockTrainingSession } from '../../testing/src/sessions.ts';
import { MS_PER_DAY } from '../src/time.ts';

describe(dailyMetricsFromSessions.name, () => {
  describe('EWMA alpha (Coggan PMC)', () => {
    it('CTL after 42 days constant TSS=50 is 50 · (1 − 1/e) ≈ 31.6, the 1-exp(-1/42) formula', () => {
      const now = Date.now();
      const sessions = Array.from({ length: 42 }, (_, i) =>
        createMockTrainingSession({
          id: `day-${i}`,
          date: now - (42 - i) * MS_PER_DAY,
          tss: 50,
        }),
      );

      const metrics = dailyMetricsFromSessions({ sessions, endDate: now - 1 * MS_PER_DAY });
      const last = metrics[metrics.length - 1];

      expect(last.ctl).toBeCloseTo(31.6, 0);
    });

    it('ATL after 7 days constant TSS=100 is 100 · (1 − 1/e) ≈ 63.2, the 1-exp(-1/7) formula', () => {
      const now = Date.now();
      const sessions = Array.from({ length: 7 }, (_, i) =>
        createMockTrainingSession({
          id: `day-${i}`,
          date: now - (7 - i) * MS_PER_DAY,
          tss: 100,
        }),
      );

      const metrics = dailyMetricsFromSessions({ sessions, endDate: now - 1 * MS_PER_DAY });
      const last = metrics[metrics.length - 1];

      expect(last.atl).toBeCloseTo(63.2, 0);
    });

    it('alpha is NOT the financial 2/(n+1) formula: one day of TSS 100 gives ATL 13.3, not 25', () => {
      const now = Date.now();
      const sessions = [
        createMockTrainingSession({ id: 'single', date: now - 1 * MS_PER_DAY, tss: 100 }),
      ];

      const metrics = dailyMetricsFromSessions({ sessions, endDate: now - 1 * MS_PER_DAY });
      const last = metrics[metrics.length - 1];

      expect(last.atl).toBeCloseTo(13.3, 0);
      expect(last.atl).not.toBeCloseTo(25.0, 0);
    });
  });
});
