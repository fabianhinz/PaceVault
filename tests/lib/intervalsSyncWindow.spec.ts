import { describe, it, expect } from 'vitest';
import { intervalsSyncWindowOldest } from '@/lib/intervalsSyncWindow.ts';
import { makeSession } from '@tests/factories/sessions.ts';

const intervals = (date: number) =>
  makeSession({ date, source: { kind: 'intervals', activityId: `i${date}` } });

describe('intervalsSyncWindowOldest', () => {
  it('is undefined without any intervals.icu session', () => {
    expect(intervalsSyncWindowOldest([])).toBeUndefined();
    expect(intervalsSyncWindowOldest([makeSession({ source: { kind: 'file' } })])).toBeUndefined();
  });

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
      makeSession({ date: new Date(2026, 9, 30, 10).getTime(), source: { kind: 'file' } }),
      makeSession({ date: new Date(2026, 10, 30, 10).getTime(), source: { kind: 'demo' } }),
    ];
    expect(intervalsSyncWindowOldest(sessions)).toBe('2026-09-06');
  });

  it('zero-pads month and day and crosses a year boundary', () => {
    expect(intervalsSyncWindowOldest([intervals(new Date(2027, 0, 10, 10).getTime())])).toBe(
      '2026-12-27',
    );
  });
});
