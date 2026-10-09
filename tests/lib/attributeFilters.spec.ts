import { describe, it, expect } from 'vitest';
import { fuzzyBounds, matchesFuzzy } from '@/lib/attributeFilters.ts';

describe('fuzzyBounds', () => {
  it('applies the relative tolerance for large targets', () => {
    expect(fuzzyBounds('duration', 14400)).toEqual({ min: 11520, max: 17280 });
    expect(fuzzyBounds('distance', 10000)).toEqual({ min: 8500, max: 11500 });
  });

  it('applies the absolute floor for small targets', () => {
    expect(fuzzyBounds('duration', 1200)).toEqual({ min: 600, max: 1800 });
    expect(fuzzyBounds('distance', 2000)).toEqual({ min: 1500, max: 2500 });
  });

  it('uses the elevation gain config', () => {
    expect(fuzzyBounds('elevationGain', 1000)).toEqual({ min: 750, max: 1250 });
    expect(fuzzyBounds('elevationGain', 200)).toEqual({ min: 50, max: 350 });
  });

  it('floor and tolerance meet at the crossover point', () => {
    expect(fuzzyBounds('duration', 3000)).toEqual({ min: 2400, max: 3600 });
  });

  it('clamps the lower bound at zero', () => {
    expect(fuzzyBounds('duration', 300)).toEqual({ min: 0, max: 900 });
  });
});

describe('matchesFuzzy', () => {
  it('matches everything when target is null', () => {
    expect(matchesFuzzy(0, 'duration', null)).toBe(true);
    expect(matchesFuzzy(99999, 'distance', null)).toBe(true);
  });

  it('matches values inside the band', () => {
    expect(matchesFuzzy(3600, 'duration', 3600)).toBe(true);
    expect(matchesFuzzy(3100, 'duration', 3600)).toBe(true);
  });

  it('includes the band boundaries', () => {
    expect(matchesFuzzy(2880, 'duration', 3600)).toBe(true);
    expect(matchesFuzzy(4320, 'duration', 3600)).toBe(true);
  });

  it('rejects values outside the band', () => {
    expect(matchesFuzzy(2879, 'duration', 3600)).toBe(false);
    expect(matchesFuzzy(4321, 'duration', 3600)).toBe(false);
  });
});
