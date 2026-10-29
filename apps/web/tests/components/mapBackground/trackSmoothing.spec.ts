import { describe, expect, it } from 'vite-plus/test';
import { rollingMean } from '@/components/mapBackground/trackSmoothing.ts';

describe(rollingMean.name, () => {
  it('averages the values inside a centred time window', () => {
    expect(
      rollingMean({ times: [0, 1, 2, 3, 4], values: [0, 10, 20, 30, 40], windowSec: 2 }),
    ).toEqual([5, 10, 20, 30, 35]);
  });

  it('keeps missing values missing and does not reach across a pause', () => {
    expect(
      rollingMean({ times: [0, 1, 2, 100], values: [10, undefined, 30, 50], windowSec: 4 }),
    ).toEqual([20, undefined, 20, 50]);
  });

  it('counts a recorded 0 as data', () => {
    expect(rollingMean({ times: [0, 1], values: [0, 100], windowSec: 2 })).toEqual([50, 50]);
  });
});
