import { describe, expect, it } from 'vitest';
import { effortPattern } from '@/lib/effortLaps.ts';
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
    efforts: { signal: 'power', limitedBy: undefined },
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
