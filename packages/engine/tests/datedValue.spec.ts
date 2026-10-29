import { describe, it, expect } from 'vite-plus/test';
import { upsertDatedValue, valueAt } from '../src/datedValue.ts';
import { MS_PER_DAY } from '../src/time.ts';

const history = [
  { date: 10 * MS_PER_DAY, value: 250 },
  { date: 20 * MS_PER_DAY, value: 270 },
];

describe('datedValue', () => {
  describe(valueAt.name, () => {
    it('returns undefined for an empty history', () => {
      expect(valueAt({ history: [], date: 15 * MS_PER_DAY })).toBeUndefined();
    });

    it('falls back to the earliest entry before the first one', () => {
      expect(valueAt({ history, date: 5 * MS_PER_DAY })).toBe(250);
    });

    it('returns the entry in effect between entries', () => {
      expect(valueAt({ history, date: 19 * MS_PER_DAY })).toBe(250);
    });

    it('returns the last entry after it', () => {
      expect(valueAt({ history, date: 40 * MS_PER_DAY })).toBe(270);
    });

    it('applies an entry from its own day on', () => {
      expect(valueAt({ history, date: 20 * MS_PER_DAY })).toBe(270);
    });

    it('resolves unsorted input', () => {
      expect(valueAt({ history: [...history].reverse(), date: 25 * MS_PER_DAY })).toBe(270);
      expect(valueAt({ history: [...history].reverse(), date: 0 })).toBe(250);
    });
  });

  describe(upsertDatedValue.name, () => {
    it('replaces a same-day entry and keeps the history sorted', () => {
      const updated = upsertDatedValue({
        history: [{ date: 20 * MS_PER_DAY, value: 270 }, ...history.slice(0, 1)],
        entry: {
          date: 20 * MS_PER_DAY,
          value: 280,
        },
      });
      expect(updated).toEqual([
        { date: 10 * MS_PER_DAY, value: 250 },
        { date: 20 * MS_PER_DAY, value: 280 },
      ]);
    });
  });
});
