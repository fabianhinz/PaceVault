import { describe, it, expect } from 'vitest';
import { computeTripTotals } from '@/features/trips/tripStats.ts';
import { makeSession } from '../../factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeTripTotals', () => {
  it('returns zeroed totals and null date range for no sessions', () => {
    const totals = computeTripTotals([]);
    expect(totals).toEqual({
      count: 0,
      distance: 0,
      duration: 0,
      elevationGain: 0,
      tss: 0,
      startDate: null,
      endDate: null,
    });
  });

  it('mirrors the single session for a one-session trip', () => {
    const date = 1_700_000_000_000;
    const totals = computeTripTotals([
      makeSession({ date, distance: 10000, duration: 1800, elevationGain: 120, tss: 45 }),
    ]);
    expect(totals.count).toBe(1);
    expect(totals.distance).toBe(10000);
    expect(totals.duration).toBe(1800);
    expect(totals.elevationGain).toBe(120);
    expect(totals.tss).toBe(45);
    expect(totals.startDate).toBe(date);
    expect(totals.endDate).toBe(date);
  });

  it('sums totals and spans the earliest/latest date across sessions', () => {
    const base = 1_700_000_000_000;
    const totals = computeTripTotals([
      makeSession({
        date: base + 2 * DAY_MS,
        distance: 5000,
        duration: 1000,
        elevationGain: 50,
        tss: 30,
      }),
      makeSession({ date: base, distance: 15000, duration: 2000, elevationGain: 200, tss: 70 }),
      makeSession({
        date: base + DAY_MS,
        distance: 8000,
        duration: 1500,
        elevationGain: 0,
        tss: 40,
      }),
    ]);
    expect(totals.count).toBe(3);
    expect(totals.distance).toBe(28000);
    expect(totals.duration).toBe(4500);
    expect(totals.elevationGain).toBe(250);
    expect(totals.tss).toBe(140);
    expect(totals.startDate).toBe(base);
    expect(totals.endDate).toBe(base + 2 * DAY_MS);
  });

  it('treats missing elevationGain as zero', () => {
    const totals = computeTripTotals([
      makeSession({ elevationGain: undefined, distance: 1000, duration: 100, tss: 10 }),
    ]);
    expect(totals.elevationGain).toBe(0);
  });
});
