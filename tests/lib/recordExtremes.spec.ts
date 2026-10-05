import { describe, it, expect } from 'vitest';
import { computeRecordExtremes } from '@/lib/recordExtremes.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

describe('computeRecordExtremes', () => {
  it('takes the raw extremes, counting a recorded 0 as a value', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3, cadence: 0, grade: 0 },
      { timestamp: 1, speed: 4, cadence: 88, grade: 12.5 },
      { timestamp: 2, speed: 2.5, cadence: 84, grade: -7 },
    ];
    const result = computeRecordExtremes(records);
    expect(result.bestPaceSecPerKm).toBe(250);
    expect(result.maxCadence).toBe(88);
    expect(result.maxGrade).toBe(12.5);
    expect(result.minGrade).toBe(-7);
  });

  it('keeps 0 as the maximum when every recorded value is 0', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0, cadence: 0, grade: 0 },
      { timestamp: 1, speed: 0, cadence: 0, grade: 0 },
    ];
    const result = computeRecordExtremes(records);
    expect(result.maxCadence).toBe(0);
    expect(result.maxGrade).toBe(0);
    expect(result.bestPaceSecPerKm).toBeUndefined();
  });

  it('leaves values undefined when they were never recorded', () => {
    const result = computeRecordExtremes([{ timestamp: 0 }, { timestamp: 1 }]);
    expect(result).toEqual({
      bestPaceSecPerKm: undefined,
      maxCadence: undefined,
      maxGrade: undefined,
      minGrade: undefined,
    });
  });
});
