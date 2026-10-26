import { describe, expect, it } from 'vite-plus/test';
import { effectiveSplitDistance } from '@/lib/laps.ts';

describe(effectiveSplitDistance.name, () => {
  it('clamps the sport default split to the session length on the slider step', () => {
    expect(
      effectiveSplitDistance({ splitDistance: null, sport: 'running', sessionMetres: 10_000 }),
    ).toBe(1000);
    expect(
      effectiveSplitDistance({ splitDistance: null, sport: 'running', sessionMetres: 700 }),
    ).toBe(500);
    expect(
      effectiveSplitDistance({ splitDistance: null, sport: 'running', sessionMetres: 300 }),
    ).toBe(500);
    expect(
      effectiveSplitDistance({ splitDistance: null, sport: 'cycling', sessionMetres: 3_400 }),
    ).toBe(3000);
    expect(
      effectiveSplitDistance({ splitDistance: null, sport: 'cycling', sessionMetres: 80_000 }),
    ).toBe(5000);
  });

  it('keeps a split distance the user picked', () => {
    expect(
      effectiveSplitDistance({ splitDistance: 2500, sport: 'running', sessionMetres: 700 }),
    ).toBe(2500);
  });
});
