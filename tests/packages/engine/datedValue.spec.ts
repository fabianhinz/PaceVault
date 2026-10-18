import { describe, it, expect } from 'vite-plus/test';
import { upsertDatedValue, valueAt } from '@/packages/engine/datedValue.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const history = [
  { date: 10 * DAY_MS, value: 250 },
  { date: 20 * DAY_MS, value: 270 },
];

describe('valueAt', () => {
  it('returns undefined for an empty history', () => {
    expect(valueAt([], 15 * DAY_MS)).toBeUndefined();
  });

  it('falls back to the earliest entry before the first one', () => {
    expect(valueAt(history, 5 * DAY_MS)).toBe(250);
  });

  it('returns the entry in effect between entries', () => {
    expect(valueAt(history, 19 * DAY_MS)).toBe(250);
  });

  it('returns the last entry after it', () => {
    expect(valueAt(history, 40 * DAY_MS)).toBe(270);
  });

  it('applies an entry from its own day on', () => {
    expect(valueAt(history, 20 * DAY_MS)).toBe(270);
  });

  it('resolves unsorted input', () => {
    expect(valueAt([...history].reverse(), 25 * DAY_MS)).toBe(270);
    expect(valueAt([...history].reverse(), 0)).toBe(250);
  });
});

describe('upsertDatedValue', () => {
  it('replaces a same-day entry and keeps the history sorted', () => {
    const updated = upsertDatedValue([{ date: 20 * DAY_MS, value: 270 }, ...history.slice(0, 1)], {
      date: 20 * DAY_MS,
      value: 280,
    });
    expect(updated).toEqual([
      { date: 10 * DAY_MS, value: 250 },
      { date: 20 * DAY_MS, value: 280 },
    ]);
  });
});
