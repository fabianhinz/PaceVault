import { describe, expect, it } from 'vitest';
import { effectiveSplitDistance } from '@/lib/lapSet.ts';

describe('effectiveSplitDistance', () => {
  it('clamps the sport default split to the session length on the slider step', () => {
    expect(effectiveSplitDistance(null, 'running', 10_000)).toBe(1000);
    expect(effectiveSplitDistance(null, 'running', 700)).toBe(500);
    expect(effectiveSplitDistance(null, 'running', 300)).toBe(500);
    expect(effectiveSplitDistance(null, 'cycling', 3_400)).toBe(3000);
    expect(effectiveSplitDistance(null, 'cycling', 80_000)).toBe(5000);
  });

  it('keeps a split distance the user picked', () => {
    expect(effectiveSplitDistance(2500, 'running', 700)).toBe(2500);
  });
});
