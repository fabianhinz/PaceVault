import { describe, it, expect } from 'vitest';
import { summarizeValues } from '@/lib/seriesSummary.ts';

describe('summarizeValues', () => {
  it('counts 0 as a value and skips missing ones', () => {
    const result = summarizeValues([0, 40, null, 80, undefined]);
    expect(result.total).toBe(120);
    expect(result.avg).toBe(40);
    expect(result.min).toBe(0);
    expect(result.max).toBe(80);
  });

  it('has no average or extremes without values', () => {
    expect(summarizeValues([null, undefined])).toEqual({
      avg: undefined,
      min: undefined,
      max: undefined,
      total: 0,
    });
  });
});
