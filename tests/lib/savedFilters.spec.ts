import { describe, it, expect, afterEach } from 'vitest';
import {
  type FilterCriteria,
  emptyCriteria,
  filterName,
  filterTile,
  matchesFilters,
  zoomTile,
} from '@/lib/savedFilters.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';

const NOW = new Date(2026, 9, 8, 18, 0).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({
  ...emptyCriteria(),
  ...overrides,
});

const run = {
  sport: 'running' as const,
  date: NOW - 3 * DAY_MS,
  duration: 3600,
  distance: 10000,
  elevationGain: 120,
};

describe('matchesFilters', () => {
  it('matches every session without an active filter', () => {
    expect(matchesFilters(run, null, NOW)).toBe(true);
    expect(matchesFilters(run, emptyCriteria(), NOW)).toBe(true);
  });

  it('filters by sport', () => {
    expect(matchesFilters(run, criteria({ sport: 'running' }), NOW)).toBe(true);
    expect(matchesFilters(run, criteria({ sport: 'cycling' }), NOW)).toBe(false);
  });

  it('filters by time', () => {
    const last7 = criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } });
    expect(matchesFilters(run, last7, NOW)).toBe(true);
    expect(matchesFilters({ ...run, date: NOW - 8 * DAY_MS }, last7, NOW)).toBe(false);
  });

  it('filters by approximate distance, duration and elevation', () => {
    expect(matchesFilters(run, criteria({ distance: 11000 }), NOW)).toBe(true);
    expect(matchesFilters(run, criteria({ distance: 12000 }), NOW)).toBe(false);
    expect(matchesFilters(run, criteria({ duration: 4200 }), NOW)).toBe(true);
    expect(matchesFilters(run, criteria({ duration: 5400 }), NOW)).toBe(false);
    expect(matchesFilters(run, criteria({ elevationGain: 200 }), NOW)).toBe(true);
    expect(matchesFilters(run, criteria({ elevationGain: 500 }), NOW)).toBe(false);
  });

  it('requires every criterion to match', () => {
    const combined = criteria({
      sport: 'running',
      time: { kind: 'relative', amount: 30, unit: 'day' },
      distance: 10000,
    });
    expect(matchesFilters(run, combined, NOW)).toBe(true);
    expect(matchesFilters({ ...run, sport: 'cycling' }, combined, NOW)).toBe(false);
    expect(matchesFilters({ ...run, distance: 20000 }, combined, NOW)).toBe(false);
  });

  it('never matches a missing value but keeps a recorded zero', () => {
    const noElevation = { ...run, elevationGain: undefined };
    expect(matchesFilters(noElevation, criteria({ elevationGain: 100 }), NOW)).toBe(false);
    expect(matchesFilters(noElevation, criteria({ sport: 'running' }), NOW)).toBe(true);
    expect(
      matchesFilters({ ...run, elevationGain: 0 }, criteria({ elevationGain: 100 }), NOW),
    ).toBe(true);
  });
});

describe('filter labels', () => {
  afterEach(() => {
    overwriteGetLocale(() => 'en');
  });

  const combined = criteria({
    sport: 'running',
    time: { kind: 'relative', amount: 30, unit: 'day' },
    distance: 10000,
  });

  it('names a filter from its parts with approximate numbers', () => {
    overwriteGetLocale(() => 'de');
    expect(filterName(combined)).toBe('Laufen · letzte 30 Tage · ca. 10 km');
    expect(filterName(criteria({ duration: 5400, elevationGain: 1200 }))).toBe(
      'ca. 1,5 h · ca. 1200 Hm',
    );

    overwriteGetLocale(() => 'en');
    expect(filterName(combined)).toBe('Running · last 30 days · about 10 km');
    expect(filterName(criteria({ duration: 2700, elevationGain: 500 }))).toBe(
      'about 45 min · about 500 m climb',
    );
  });

  it('titles a tile by sport, or by its first part for all sports', () => {
    overwriteGetLocale(() => 'de');
    expect(filterTile(combined)).toEqual({
      kind: 'sport',
      title: 'Laufen',
      description: 'letzte 30 Tage · ca. 10 km',
    });
    expect(filterTile(criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }))).toEqual({
      kind: 'time',
      title: 'Dieses Jahr',
      description: 'alle Sportarten',
    });
    expect(filterTile(criteria({ sport: 'cycling' }))).toEqual({
      kind: 'sport',
      title: 'Radfahren',
      description: 'gesamter Zeitraum',
    });
  });

  it('titles the zoom row by day and month and describes it by year and the other criteria', () => {
    overwriteGetLocale(() => 'de');
    const zoomed = criteria({
      sport: 'running',
      time: { kind: 'range', from: '2026-09-27', to: '2026-10-07', source: 'zoom' },
    });
    expect(zoomTile(zoomed)).toEqual({
      title: '27. Sept.\u2009–\u20097. Okt.',
      description: '2026 · Laufen',
    });
    const acrossYears = criteria({
      sport: 'running',
      time: { kind: 'range', from: '2025-12-28', to: '2026-02-14', source: 'zoom' },
      distance: 10000,
    });
    expect(zoomTile(acrossYears)).toEqual({
      title: '28. Dez.\u2009–\u200914. Feb.',
      description: '2025–2026 · Laufen · ca. 10 km',
    });
    expect(zoomTile(criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }))).toBeNull();
    expect(zoomTile(null)).toBeNull();
  });
});
