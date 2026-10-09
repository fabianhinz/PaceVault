import { describe, it, expect } from 'vitest';
import { resolveFilterRange } from '@/lib/timeRange.ts';

const NOW = new Date(2026, 9, 8, 18, 0).getTime();
const endOfDay = (year: number, month: number, day: number) =>
  new Date(year, month, day, 23, 59, 59, 999).getTime();

describe('resolveFilterRange', () => {
  it('returns no range for all time', () => {
    expect(resolveFilterRange(null, NOW)).toBeNull();
  });

  it('counts relative days including today', () => {
    expect(resolveFilterRange({ kind: 'relative', amount: 7, unit: 'day' }, NOW)).toEqual({
      from: new Date(2026, 9, 2).getTime(),
      to: endOfDay(2026, 9, 8),
    });
  });

  it('resolves relative weeks and months to whole days', () => {
    expect(resolveFilterRange({ kind: 'relative', amount: 2, unit: 'week' }, NOW)?.from).toBe(
      new Date(2026, 8, 25).getTime(),
    );
    expect(resolveFilterRange({ kind: 'relative', amount: 1, unit: 'month' }, NOW)?.from).toBe(
      new Date(2026, 8, 9).getTime(),
    );
  });

  it('ends this year today and keeps last year whole', () => {
    expect(resolveFilterRange({ kind: 'calendarYear', yearsAgo: 0 }, NOW)).toEqual({
      from: new Date(2026, 0, 1).getTime(),
      to: endOfDay(2026, 9, 8),
    });
    expect(resolveFilterRange({ kind: 'calendarYear', yearsAgo: 1 }, NOW)).toEqual({
      from: new Date(2025, 0, 1).getTime(),
      to: endOfDay(2025, 11, 31),
    });
  });

  it('resolves a zoom range to local day bounds', () => {
    expect(
      resolveFilterRange(
        { kind: 'range', from: '2026-03-01', to: '2026-03-15', source: 'zoom' },
        NOW,
      ),
    ).toEqual({ from: new Date(2026, 2, 1).getTime(), to: endOfDay(2026, 2, 15) });
  });
});
