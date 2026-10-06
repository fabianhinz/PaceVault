import { describe, expect, it } from 'vitest';
import { summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapAnalysis } from '@/lib/laps.ts';

const lap = (overrides: Partial<LapAnalysis>): LapAnalysis => ({
  lapIndex: 0,
  paceSecPerKm: 300,
  avgHr: undefined,
  minHr: undefined,
  maxHr: undefined,
  avgCadence: undefined,
  distance: 1000,
  duration: 300,
  movingTime: 300,
  elevationGain: undefined,
  intensity: 'active',
  maxSpeed: undefined,
  isInterval: false,
  isPartial: false,
  ...overrides,
});

describe('summarizeLaps', () => {
  it('ranks full active laps and leaves out the partial split and recovery laps', () => {
    const summary = summarizeLaps([
      lap({ lapIndex: 0, paceSecPerKm: 290 }),
      lap({ lapIndex: 1, paceSecPerKm: 310 }),
      lap({ lapIndex: 2, paceSecPerKm: 600, intensity: 'recovery' }),
      lap({ lapIndex: 3, paceSecPerKm: 240, distance: 300, isPartial: true }),
    ]);
    expect(summary.count).toBe(4);
    expect(summary.fastest?.lapIndex).toBe(0);
    expect(summary.slowest?.lapIndex).toBe(1);
    expect(summary.spreadSecPerKm).toBe(20);
  });

  it('has no spread with fewer than two ranked laps', () => {
    const summary = summarizeLaps([
      lap({ lapIndex: 0, paceSecPerKm: 290 }),
      lap({ lapIndex: 1, paceSecPerKm: undefined, distance: 0 }),
    ]);
    expect(summary.fastest?.lapIndex).toBe(0);
    expect(summary.spreadSecPerKm).toBeUndefined();
  });
});
