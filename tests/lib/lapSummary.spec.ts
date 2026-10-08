import { describe, expect, it } from 'vitest';
import { summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapSet } from '@/lib/lapSet.ts';
import type { LapAnalysis } from '@/lib/laps.ts';

const lap = (overrides: Partial<LapAnalysis>): LapAnalysis => ({
  lapIndex: 0,
  paceSecPerKm: 300,
  avgHr: undefined,
  minHr: undefined,
  maxHr: undefined,
  avgCadence: undefined,
  distance: 1000,
  timerTime: 300,
  movingTime: 300,
  elevationGain: undefined,
  intensity: 'active',
  maxSpeed: undefined,
  isInterval: false,
  isPartial: false,
  ...overrides,
});

const setOf = (analysis: LapAnalysis[], hrRecoveries: number[] = []): LapSet => ({
  analysis,
  enrichments: [],
  spans: [],
  bands: [],
  hrRecoveries,
});

describe('summarizeLaps', () => {
  it('lap summary over all laps counts warm-up, recovery and the partial split', () => {
    const summary = summarizeLaps(
      setOf([
        lap({ lapIndex: 0, intensity: 'warmup', paceSecPerKm: 360, movingTime: 360 }),
        lap({ lapIndex: 1, paceSecPerKm: 290, movingTime: 290 }),
        lap({
          lapIndex: 2,
          intensity: 'recovery',
          paceSecPerKm: 600,
          distance: 200,
          movingTime: 120,
        }),
        lap({ lapIndex: 3, paceSecPerKm: 300, movingTime: 300 }),
        lap({ lapIndex: 4, isPartial: true, paceSecPerKm: 250, distance: 300, movingTime: 75 }),
      ]),
    );
    expect(summary.count).toBe(5);
    expect(summary.avgSecPerKm).toBeCloseTo((1145 / 3500) * 1000);
    expect(summary.fastest?.lapIndex).toBe(4);
    expect(summary.slowest?.lapIndex).toBe(2);
  });

  it('averages the HR recovery of interval device laps only', () => {
    const intervals = summarizeLaps(
      setOf(
        [lap({ lapIndex: 0, isInterval: true }), lap({ lapIndex: 1, intensity: 'rest' })],
        [30, 26],
      ),
    );
    expect(intervals.isIntervals).toBe(true);
    expect(intervals.avgHrRecovery).toBe(28);

    const steady = summarizeLaps(setOf([lap({ lapIndex: 0 }), lap({ lapIndex: 1 })], [30]));
    expect(steady.avgHrRecovery).toBeUndefined();
  });
});
