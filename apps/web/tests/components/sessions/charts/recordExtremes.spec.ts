import { describe, it, expect } from 'vite-plus/test';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { computeRecordExtremes } from '@/components/sessions/charts/recordExtremes.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';

describe(computeRecordExtremes.name, () => {
  it('takes the raw extremes, counting a recorded 0 as a value', () => {
    const records: SessionRecord[] = [
      createMockSessionRecord({ timestamp: 0, speed: 3, cadence: 0 }),
      createMockSessionRecord({ timestamp: 1, speed: 4, cadence: 88 }),
      createMockSessionRecord({ timestamp: 2, speed: 2.5, cadence: 84 }),
    ];
    const result = computeRecordExtremes({ records, gradients: [0, 0.125, -0.07] });
    expect(result.bestPaceSecPerKm).toBe(250);
    expect(result.maxCadence).toBe(88);
    expect(result.maxGrade).toBeCloseTo(12.5, 6);
    expect(result.minGrade).toBeCloseTo(-7, 6);
  });

  it('keeps 0 as the maximum when every recorded value is 0', () => {
    const records: SessionRecord[] = [
      createMockSessionRecord({ timestamp: 0, speed: 0, cadence: 0 }),
      createMockSessionRecord({ timestamp: 1, speed: 0, cadence: 0 }),
    ];
    const result = computeRecordExtremes({ records, gradients: [0, 0] });
    expect(result.maxCadence).toBe(0);
    expect(result.maxGrade).toBe(0);
    expect(result.bestPaceSecPerKm).toBeUndefined();
  });

  it('leaves values undefined when they were never recorded', () => {
    const result = computeRecordExtremes({
      records: [
        createMockSessionRecord({ timestamp: 0 }),
        createMockSessionRecord({ timestamp: 1 }),
      ],
      gradients: [undefined, undefined],
    });
    expect(result).toEqual({
      bestPaceSecPerKm: undefined,
      maxCadence: undefined,
      maxGrade: undefined,
      minGrade: undefined,
    });
  });
});
