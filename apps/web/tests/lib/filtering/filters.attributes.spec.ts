import { describe, it, expect } from 'vite-plus/test';
import { fuzzyBounds, matchesFuzzy } from '@/lib/filtering/filters.ts';

describe(fuzzyBounds.name, () => {
  it('applies the relative tolerance for large targets', () => {
    expect(fuzzyBounds({ key: 'duration', target: 14400 })).toEqual({ min: 11520, max: 17280 });
    expect(fuzzyBounds({ key: 'distance', target: 10000 })).toEqual({ min: 8500, max: 11500 });
  });

  it('applies the absolute floor for small targets', () => {
    expect(fuzzyBounds({ key: 'duration', target: 1200 })).toEqual({ min: 600, max: 1800 });
    expect(fuzzyBounds({ key: 'distance', target: 2000 })).toEqual({ min: 1500, max: 2500 });
  });

  it('uses the elevation gain config', () => {
    expect(fuzzyBounds({ key: 'elevationGain', target: 1000 })).toEqual({ min: 750, max: 1250 });
    expect(fuzzyBounds({ key: 'elevationGain', target: 200 })).toEqual({ min: 50, max: 350 });
  });

  it('floor and tolerance meet at the crossover point', () => {
    expect(fuzzyBounds({ key: 'duration', target: 3000 })).toEqual({ min: 2400, max: 3600 });
  });

  it('clamps the lower bound at zero', () => {
    expect(fuzzyBounds({ key: 'duration', target: 300 })).toEqual({ min: 0, max: 900 });
  });
});

describe(matchesFuzzy.name, () => {
  it('matches everything when target is null', () => {
    expect(matchesFuzzy({ value: 0, key: 'duration', target: null })).toBe(true);
    expect(matchesFuzzy({ value: 99999, key: 'distance', target: null })).toBe(true);
  });

  it('matches values inside the band', () => {
    expect(matchesFuzzy({ value: 3600, key: 'duration', target: 3600 })).toBe(true);
    expect(matchesFuzzy({ value: 3100, key: 'duration', target: 3600 })).toBe(true);
  });

  it('includes the band boundaries', () => {
    expect(matchesFuzzy({ value: 2880, key: 'duration', target: 3600 })).toBe(true);
    expect(matchesFuzzy({ value: 4320, key: 'duration', target: 3600 })).toBe(true);
  });

  it('rejects values outside the band', () => {
    expect(matchesFuzzy({ value: 2879, key: 'duration', target: 3600 })).toBe(false);
    expect(matchesFuzzy({ value: 4321, key: 'duration', target: 3600 })).toBe(false);
  });
});
