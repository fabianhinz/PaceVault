import { describe, it, expect } from 'vite-plus/test';
import { intervalsSyncWindowOldest, intervalsSyncWindowStart } from '@/lib/api/intervals.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';

const intervals = (date: number) =>
  createMockTrainingSession({ date, source: { kind: 'intervals', activityId: `i${date}` } });

describe(intervalsSyncWindowOldest.name, () => {
  it('starts 30 days before the newest intervals.icu session, as a local date', () => {
    const sessions = [
      intervals(new Date(2026, 8, 1, 10).getTime()),
      intervals(new Date(2026, 8, 20, 10).getTime()),
      intervals(new Date(2026, 8, 12, 10).getTime()),
    ];
    expect(intervalsSyncWindowOldest(sessions)).toBe('2026-08-21');
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
    expect(intervalsSyncWindowOldest(sessions)).toBe('2026-08-21');
  });

  it('zero-pads month and day and crosses a year boundary', () => {
    expect(intervalsSyncWindowOldest([intervals(new Date(2027, 0, 10, 10).getTime())])).toBe(
      '2026-12-11',
    );
  });
});

describe(intervalsSyncWindowStart.name, () => {
  it('returns the window start in ms, 30 days before the newest intervals.icu session', () => {
    const newest = new Date(2026, 8, 20, 10).getTime();
    const sessions = [intervals(new Date(2026, 8, 1, 10).getTime()), intervals(newest)];
    expect(intervalsSyncWindowStart(sessions)).toBe(newest - 30 * MS_PER_DAY);
  });

  it('has no window before the first intervals.icu session', () => {
    expect(
      intervalsSyncWindowStart([createMockTrainingSession({ source: { kind: 'file' } })]),
    ).toBeUndefined();
  });
});
