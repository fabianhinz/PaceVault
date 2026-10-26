import { describe, it, expect } from 'vite-plus/test';
import { groupSteps } from '@/lib/groupSteps.ts';
import { createMockWorkoutStep } from '@tests/factories/coaching.ts';

describe(groupSteps.name, () => {
  it('returns empty array for empty input', () => {
    expect(groupSteps([])).toEqual([]);
  });

  it('wraps single steps as kind=single', () => {
    const steps = [
      createMockWorkoutStep({ type: 'warmup' }),
      createMockWorkoutStep({ type: 'cooldown' }),
    ];
    const result = groupSteps(steps);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('single');
    expect(result[1].kind).toBe('single');
  });

  it('groups consecutive steps with the same repeat > 1 as an interval', () => {
    const steps = [
      createMockWorkoutStep({ type: 'work', repeat: 4 }),
      createMockWorkoutStep({ type: 'recovery', repeat: 4 }),
    ];
    const result = groupSteps(steps);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('interval');
    if (result[0].kind === 'interval') {
      expect(result[0].repeat).toBe(4);
      expect(result[0].steps).toHaveLength(2);
    }
  });

  it('handles mixed repeats and singles', () => {
    const steps = [
      createMockWorkoutStep({ type: 'warmup' }),
      createMockWorkoutStep({ type: 'work', repeat: 3 }),
      createMockWorkoutStep({ type: 'recovery', repeat: 3 }),
      createMockWorkoutStep({ type: 'cooldown' }),
    ];
    const result = groupSteps(steps);
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe('single');
    expect(result[1].kind).toBe('interval');
    expect(result[2].kind).toBe('single');
  });

  it('treats repeat=1 as a single step', () => {
    const steps = [
      createMockWorkoutStep({ type: 'work', repeat: 1 }),
      createMockWorkoutStep({ type: 'recovery', repeat: 1 }),
    ];
    const result = groupSteps(steps);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('single');
    expect(result[1].kind).toBe('single');
  });

  it('keeps separate interval groups when repeat values differ', () => {
    const steps = [
      createMockWorkoutStep({ type: 'work', repeat: 4 }),
      createMockWorkoutStep({ type: 'recovery', repeat: 4 }),
      createMockWorkoutStep({ type: 'work', repeat: 2 }),
      createMockWorkoutStep({ type: 'recovery', repeat: 2 }),
    ];
    const result = groupSteps(steps);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('interval');
    expect(result[1].kind).toBe('interval');
    if (result[0].kind === 'interval' && result[1].kind === 'interval') {
      expect(result[0].repeat).toBe(4);
      expect(result[1].repeat).toBe(2);
    }
  });
});
