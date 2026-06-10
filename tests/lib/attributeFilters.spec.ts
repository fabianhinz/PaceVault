import { describe, it, expect } from 'vitest';
import {
  type AttributeFilters,
  createEmptyAttributeFilters,
  fuzzyBounds,
  hoursToSeconds,
  isAttributeFilterActive,
  kmToMetres,
  matchesAttributeFilters,
  matchesFuzzy,
  metresToKm,
  parseDecimalInput,
  sanitizeAttributeFilters,
  secondsToHours,
} from '@/lib/attributeFilters.ts';

describe('parseDecimalInput', () => {
  it('parses dot decimals', () => {
    expect(parseDecimalInput('1.5')).toBe(1.5);
  });

  it('parses comma decimals', () => {
    expect(parseDecimalInput('1,5')).toBe(1.5);
    expect(parseDecimalInput('12,5')).toBe(12.5);
  });

  it('parses integers and trims whitespace', () => {
    expect(parseDecimalInput(' 10 ')).toBe(10);
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('   ')).toBeNull();
  });

  it('returns null for zero and negative values', () => {
    expect(parseDecimalInput('0')).toBeNull();
    expect(parseDecimalInput('-3')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('1h30')).toBeNull();
  });

  it('returns null for thousands-separator style input', () => {
    // '1.234,5' is not supported — documented limitation
    expect(parseDecimalInput('1.234,5')).toBeNull();
  });

  it('returns null for non-finite input', () => {
    expect(parseDecimalInput('Infinity')).toBeNull();
  });
});

describe('unit conversions', () => {
  it('converts hours to seconds with rounding', () => {
    expect(hoursToSeconds(1.5)).toBe(5400);
    expect(hoursToSeconds(0.333)).toBe(1199);
  });

  it('converts seconds to hours with two decimals', () => {
    expect(secondsToHours(5400)).toBe(1.5);
    expect(secondsToHours(5430)).toBe(1.51);
  });

  it('converts km to metres with rounding', () => {
    expect(kmToMetres(12.5)).toBe(12500);
    expect(kmToMetres(0.1)).toBe(100);
  });

  it('converts metres to km with two decimals', () => {
    expect(metresToKm(12345)).toBe(12.35);
    expect(metresToKm(10000)).toBe(10);
  });
});

describe('sanitizeAttributeFilters', () => {
  it('passes valid targets through', () => {
    expect(
      sanitizeAttributeFilters({ duration: 3600, distance: 10000, elevationGain: 500 }),
    ).toEqual({
      duration: 3600,
      distance: 10000,
      elevationGain: 500,
    });
  });

  it('nulls zero, negative, NaN and Infinity targets', () => {
    expect(sanitizeAttributeFilters({ duration: 0, distance: -5, elevationGain: NaN })).toEqual({
      duration: null,
      distance: null,
      elevationGain: null,
    });
    expect(
      sanitizeAttributeFilters({ duration: NaN, distance: Infinity, elevationGain: -1 }),
    ).toEqual({
      duration: null,
      distance: null,
      elevationGain: null,
    });
  });

  it('keeps null targets null', () => {
    expect(sanitizeAttributeFilters(createEmptyAttributeFilters())).toEqual({
      duration: null,
      distance: null,
      elevationGain: null,
    });
  });
});

describe('fuzzyBounds', () => {
  it('applies the relative tolerance for large targets', () => {
    // duration 4h: 20% (2880) beats the 600s floor
    expect(fuzzyBounds('duration', 14400)).toEqual({ min: 11520, max: 17280 });
    // distance 10km: 15% (1500) beats the 500m floor
    expect(fuzzyBounds('distance', 10000)).toEqual({ min: 8500, max: 11500 });
  });

  it('applies the absolute floor for small targets', () => {
    // duration 20min: 20% would be 240s — floor of 600s wins
    expect(fuzzyBounds('duration', 1200)).toEqual({ min: 600, max: 1800 });
    // distance 2km: 15% would be 300m — floor of 500m wins
    expect(fuzzyBounds('distance', 2000)).toEqual({ min: 1500, max: 2500 });
  });

  it('uses the elevation gain config', () => {
    // 1000m gain: 25% (250) beats the 150m floor
    expect(fuzzyBounds('elevationGain', 1000)).toEqual({ min: 750, max: 1250 });
    // 200m gain: 25% would be 50m — floor of 150m wins
    expect(fuzzyBounds('elevationGain', 200)).toEqual({ min: 50, max: 350 });
  });

  it('floor and tolerance meet at the crossover point', () => {
    // duration 50min: 20% of 3000s equals the 600s floor exactly
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

describe('matchesAttributeFilters', () => {
  const session = { duration: 3600, distance: 10000, elevationGain: 500 };
  const filtersWith = (overrides: Partial<AttributeFilters>): AttributeFilters => ({
    ...createEmptyAttributeFilters(),
    ...overrides,
  });

  it('matches every session when filters are empty, including zero-distance sessions', () => {
    const empty = createEmptyAttributeFilters();
    expect(matchesAttributeFilters(session, empty)).toBe(true);
    expect(matchesAttributeFilters({ duration: 1800, distance: 0 }, empty)).toBe(true);
  });

  it('filters by duration only', () => {
    const filters = filtersWith({ duration: 3600 });
    expect(matchesAttributeFilters(session, filters)).toBe(true);
    expect(matchesAttributeFilters({ duration: 1800, distance: 10000 }, filters)).toBe(false);
  });

  it('filters by distance only', () => {
    const filters = filtersWith({ distance: 10000 });
    expect(matchesAttributeFilters(session, filters)).toBe(true);
    expect(matchesAttributeFilters({ duration: 3600, distance: 30000 }, filters)).toBe(false);
  });

  it('filters by elevation gain only', () => {
    const filters = filtersWith({ elevationGain: 500 });
    expect(matchesAttributeFilters(session, filters)).toBe(true);
    expect(
      matchesAttributeFilters({ duration: 3600, distance: 10000, elevationGain: 1500 }, filters),
    ).toBe(false);
  });

  it('treats missing elevation gain as zero', () => {
    // sessions without elevation data only match targets whose band reaches 0
    const lowTarget = filtersWith({ elevationGain: 100 }); // band 0–250
    const highTarget = filtersWith({ elevationGain: 500 }); // band 350–650
    expect(matchesAttributeFilters({ duration: 3600, distance: 10000 }, lowTarget)).toBe(true);
    expect(matchesAttributeFilters({ duration: 3600, distance: 10000 }, highTarget)).toBe(false);
  });

  it('requires all set attributes to match', () => {
    const filters = filtersWith({ duration: 3600, distance: 10000 });
    expect(matchesAttributeFilters(session, filters)).toBe(true);
    expect(matchesAttributeFilters({ duration: 3600, distance: 30000 }, filters)).toBe(false);
    expect(matchesAttributeFilters({ duration: 7200, distance: 10000 }, filters)).toBe(false);
  });

  it('uses the attribute-specific fuzzy config', () => {
    // 20min target: duration floor (±10min) admits a 30min session
    expect(
      matchesAttributeFilters({ duration: 1800, distance: 0 }, filtersWith({ duration: 1200 })),
    ).toBe(true);
    // 2km target: distance floor (±500m) admits a 2.5km session but not 2.6km
    expect(
      matchesAttributeFilters({ duration: 1800, distance: 2500 }, filtersWith({ distance: 2000 })),
    ).toBe(true);
    expect(
      matchesAttributeFilters({ duration: 1800, distance: 2600 }, filtersWith({ distance: 2000 })),
    ).toBe(false);
  });

  it('excludes zero-distance sessions when a distance target is set', () => {
    const filters = filtersWith({ distance: 5000 });
    expect(matchesAttributeFilters({ duration: 1800, distance: 0 }, filters)).toBe(false);
  });

  it('tolerates persisted filter state that lacks newer keys', () => {
    // state persisted before elevationGain existed has no such key at all
    const stale = { duration: 3600, distance: null } as unknown as AttributeFilters;
    expect(matchesAttributeFilters(session, stale)).toBe(true);
  });
});

describe('isAttributeFilterActive', () => {
  it('is false for empty filters', () => {
    expect(isAttributeFilterActive(createEmptyAttributeFilters())).toBe(false);
  });

  it('is true when any target is set', () => {
    expect(isAttributeFilterActive({ duration: 3600, distance: null, elevationGain: null })).toBe(
      true,
    );
    expect(isAttributeFilterActive({ duration: null, distance: null, elevationGain: 500 })).toBe(
      true,
    );
  });

  it('ignores missing keys in persisted state', () => {
    const stale = { duration: null, distance: null } as unknown as AttributeFilters;
    expect(isAttributeFilterActive(stale)).toBe(false);
  });
});
