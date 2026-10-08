import { describe, expect, it } from 'vitest';
import { rollingMean } from '@/lib/trackSmoothing.ts';

describe('rollingMean', () => {
  it('averages the values inside a centred time window', () => {
    expect(rollingMean([0, 1, 2, 3, 4], [0, 10, 20, 30, 40], 2)).toEqual([5, 10, 20, 30, 35]);
  });

  it('keeps missing values missing and does not reach across a pause', () => {
    expect(rollingMean([0, 1, 2, 100], [10, undefined, 30, 50], 4)).toEqual([
      20,
      undefined,
      20,
      50,
    ]);
  });

  it('counts a recorded 0 as data', () => {
    expect(rollingMean([0, 1], [0, 100], 2)).toEqual([50, 50]);
  });
});
