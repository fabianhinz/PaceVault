import { describe, expect, it } from 'vitest';
import { activeRailRange, computeRangeStats } from '@/lib/railRange.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const ride = (hrs: number[], elevations: number[]): SessionRecord[] =>
  hrs.map((hr, i) => ({
    timestamp: i * 60,
    distance: i * 300,
    speed: 5,
    hr,
    cadence: 0,
    elevation: elevations[i],
  }));

describe('activeRailRange', () => {
  const lap = { lapIndex: 2, from: 4, to: 8 };

  it('a selected lap limits the rail to that lap', () => {
    expect(activeRailRange(null, lap)).toEqual({ from: 4, to: 8 });
  });

  it('an active zoom wins over the selected lap', () => {
    expect(activeRailRange({ from: 1, to: 3 }, lap)).toEqual({ from: 1, to: 3 });
  });

  it('without zoom or lap the rail covers the whole session', () => {
    expect(activeRailRange(null, undefined)).toBeNull();
  });
});

describe('computeRangeStats', () => {
  it('rail values of a selected lap only cover that lap', () => {
    const records = ride([100, 110, 150, 170, 120], [10, 12, 20, 15, 30]);
    const stats = computeRangeStats(records, { from: 2, to: 3 });
    expect(stats.avgHr).toBe(160);
    expect(stats.maxHr).toBe(170);
    expect(stats.elevationGain).toBe(0);
    expect(stats.elevationLoss).toBe(5);
    expect(stats.avgSpeed).toBe(5);
    expect(stats.avgPaceSecPerKm).toBe(200);
  });

  it('counts a recorded 0 cadence as a value', () => {
    const records = ride([100, 110, 120], [10, 10, 10]);
    const stats = computeRangeStats(records, { from: 0, to: 2 });
    expect(stats.avgCadence).toBe(0);
    expect(stats.maxCadence).toBe(0);
  });
});
