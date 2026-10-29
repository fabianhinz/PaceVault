import { describe, it, expect } from 'vite-plus/test';
import { intervalsSyncWindowOldest } from '@/lib/api/intervals.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';

const intervals = (date: number) =>
  createMockTrainingSession({ date, source: { kind: 'intervals', activityId: `i${date}` } });

describe(intervalsSyncWindowOldest.name, () => {
  it('starts 14 days before the newest intervals.icu session, as a local date', () => {
    const sessions = [
      intervals(new Date(2026, 8, 1, 10).getTime()),
      intervals(new Date(2026, 8, 20, 10).getTime()),
      intervals(new Date(2026, 8, 12, 10).getTime()),
    ];
    expect(intervalsSyncWindowOldest(sessions)).toBe('2026-09-06');
  });

  it('ignores newer sessions from other sources', () => {
    const sessions = [
      intervals(new Date(2026, 8, 20, 10).getTime()),
      createMockTrainingSession({
        date: new Date(2026, 9, 30, 10).getTime(),
        source: { kind: 'file' },
      }),
      createMockTrainingSession({
        date: new Date(2026, 10, 30, 10).getTime(),
        source: { kind: 'demo' },
      }),
    ];
    expect(intervalsSyncWindowOldest(sessions)).toBe('2026-09-06');
  });

  it('zero-pads month and day and crosses a year boundary', () => {
    expect(intervalsSyncWindowOldest([intervals(new Date(2027, 0, 10, 10).getTime())])).toBe(
      '2026-12-27',
    );
  });
});
