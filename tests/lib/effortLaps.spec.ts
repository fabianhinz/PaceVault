import { describe, expect, it } from 'vitest';
import { effortPattern, effortWorkAverage } from '@/lib/effortLaps.ts';
import type { EffortBlock, EffortKind } from '@/packages/engine/effortDetection.ts';
import type { LapAnalysis } from '@/lib/laps.ts';
import type { LapSet } from '@/lib/lapSet.ts';

const lap = (lapIndex: number, movingTime: number, isInterval: boolean): LapAnalysis => {
  let intensity = 'rest';
  if (isInterval) intensity = 'active';
  return {
    lapIndex,
    paceSecPerKm: undefined,
    distance: undefined,
    movingTime,
    intensity,
    isInterval,
    isPartial: false,
  };
};

const setOf = (workTimes: number[]): LapSet => {
  const analysis: LapAnalysis[] = [lap(0, 900, false)];
  workTimes.forEach((movingTime, k) => {
    analysis.push(lap(analysis.length, movingTime, true));
    if (k < workTimes.length - 1) analysis.push(lap(analysis.length, 180, false));
  });
  return {
    analysis,
    spans: [],
    bands: [],
    hrRecoveries: [],
    efforts: { signal: 'power', limitedBy: undefined, workAverage: 290 },
  };
};

describe('effortPattern', () => {
  it('reads five work blocks within ±10 % as "5 × mean", ignoring recoveries', () => {
    const pattern = effortPattern(setOf([241, 238, 243, 240, 239]));

    expect(pattern?.count).toBe(5);
    expect(pattern?.movingTime).toBeCloseTo(240.2, 1);
  });

  it('has no pattern when one work block is 20 % longer, so the chip falls back to the count', () => {
    expect(effortPattern(setOf([240, 240, 240, 240, 288]))).toBeUndefined();
  });
});

const block = (
  kind: EffortKind,
  movingTime: number,
  signalMean: number | undefined,
): EffortBlock => ({
  kind,
  start: 0,
  end: movingTime,
  startIndex: 0,
  endIndex: 0,
  movingTime,
  signalMean,
});

describe('effortWorkAverage', () => {
  it('weights work-block power by moving time and ignores recoveries', () => {
    const blocks = [
      block('warmup', 900, 150),
      block('work', 240, 300),
      block('rest', 180, 120),
      block('work', 120, 270),
    ];

    expect(effortWorkAverage(blocks, 'power')).toBeCloseTo(290, 6);
  });

  it('turns the averaged grade-adjusted speed into sec/km, time-weighted', () => {
    // 2 × 100 s at 4 m/s and 1 × 200 s at 5 m/s: 4.5 m/s → 222.2 s/km
    const blocks = [block('work', 100, 4), block('work', 100, 4), block('work', 200, 5)];

    expect(effortWorkAverage(blocks, 'pace')).toBeCloseTo(1000 / 4.5, 6);
  });

  it('averages heart rate in bpm', () => {
    expect(effortWorkAverage([block('work', 180, 165), block('work', 180, 171)], 'hr')).toBe(168);
  });

  it('keeps a recorded 0 W average as 0', () => {
    expect(effortWorkAverage([block('work', 60, 0), block('work', 60, 0)], 'power')).toBe(0);
  });

  it('has no value when no work block has samples', () => {
    const blocks = [block('work', 60, undefined), block('rest', 60, 120)];

    expect(effortWorkAverage(blocks, 'power')).toBeUndefined();
  });
});
