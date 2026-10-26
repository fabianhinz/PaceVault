import { describe, it, expect, afterEach } from 'vite-plus/test';
import {
  type FilterCriteria,
  emptyCriteria,
  filterName,
  filterTile,
  matchesFilters,
  zoomTile,
} from '@/lib/savedFilters.ts';
import { overwriteGetLocale } from '@pacevault/i18n/runtime.js';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import { importInLocale } from '@testUtils/locale.ts';

const NOW = new Date(2026, 9, 8, 18, 0).getTime();

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({
  ...emptyCriteria(),
  ...overrides,
});

const run = {
  sport: 'running' as const,
  date: NOW - 3 * MS_PER_DAY,
  duration: 3600,
  distance: 10000,
  elevationGain: 120,
};

describe(matchesFilters.name, () => {
  it('matches every session without an active filter', () => {
    expect(matchesFilters({ session: run, criteria: null, now: NOW })).toBe(true);
    expect(matchesFilters({ session: run, criteria: emptyCriteria(), now: NOW })).toBe(true);
  });

  it('filters by sport', () => {
    expect(
      matchesFilters({ session: run, criteria: criteria({ sport: 'running' }), now: NOW }),
    ).toBe(true);
    expect(
      matchesFilters({ session: run, criteria: criteria({ sport: 'cycling' }), now: NOW }),
    ).toBe(false);
  });

  it('filters by time', () => {
    const last7 = criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } });
    expect(matchesFilters({ session: run, criteria: last7, now: NOW })).toBe(true);
    expect(
      matchesFilters({
        session: { ...run, date: NOW - 8 * MS_PER_DAY },
        criteria: last7,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('filters by approximate distance, duration and elevation', () => {
    expect(
      matchesFilters({ session: run, criteria: criteria({ distance: 11000 }), now: NOW }),
    ).toBe(true);
    expect(
      matchesFilters({ session: run, criteria: criteria({ distance: 12000 }), now: NOW }),
    ).toBe(false);
    expect(matchesFilters({ session: run, criteria: criteria({ duration: 4200 }), now: NOW })).toBe(
      true,
    );
    expect(matchesFilters({ session: run, criteria: criteria({ duration: 5400 }), now: NOW })).toBe(
      false,
    );
    expect(
      matchesFilters({ session: run, criteria: criteria({ elevationGain: 200 }), now: NOW }),
    ).toBe(true);
    expect(
      matchesFilters({ session: run, criteria: criteria({ elevationGain: 500 }), now: NOW }),
    ).toBe(false);
  });

  it('requires every criterion to match', () => {
    const combined = criteria({
      sport: 'running',
      time: { kind: 'relative', amount: 30, unit: 'day' },
      distance: 10000,
    });
    expect(matchesFilters({ session: run, criteria: combined, now: NOW })).toBe(true);
    expect(
      matchesFilters({ session: { ...run, sport: 'cycling' }, criteria: combined, now: NOW }),
    ).toBe(false);
    expect(
      matchesFilters({ session: { ...run, distance: 20000 }, criteria: combined, now: NOW }),
    ).toBe(false);
  });

  it('never matches a missing value but keeps a recorded zero', () => {
    const noElevation = { ...run, elevationGain: undefined };
    expect(
      matchesFilters({
        session: noElevation,
        criteria: criteria({ elevationGain: 100 }),
        now: NOW,
      }),
    ).toBe(false);
    expect(
      matchesFilters({ session: noElevation, criteria: criteria({ sport: 'running' }), now: NOW }),
    ).toBe(true);
    expect(
      matchesFilters({
        session: { ...run, elevationGain: 0 },
        criteria: criteria({ elevationGain: 100 }),
        now: NOW,
      }),
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

  it('names a filter from its parts with approximate numbers', async () => {
    const german = await importInLocale('de', () => import('@/lib/savedFilters.ts'));
    expect(german.filterName(combined)).toBe('Laufen · letzte 30 Tage · ca. 10 km');
    expect(german.filterName(criteria({ duration: 5400, elevationGain: 1200 }))).toBe(
      'ca. 1,5 h · ca. 1200 Hm',
    );

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

  it('titles the zoom row by day and month and describes it by year and the other criteria', async () => {
    const german = await importInLocale('de', () => import('@/lib/savedFilters.ts'));
    const zoomed = criteria({
      sport: 'running',
      time: { kind: 'range', from: '2026-09-27', to: '2026-10-07', source: 'zoom' },
    });
    expect(german.zoomTile(zoomed)).toEqual({
      title: '27. Sept.\u2009–\u20097. Okt.',
      description: '2026 · Laufen',
    });
    const acrossYears = criteria({
      sport: 'running',
      time: { kind: 'range', from: '2025-12-28', to: '2026-02-14', source: 'zoom' },
      distance: 10000,
    });
    expect(german.zoomTile(acrossYears)).toEqual({
      title: '28. Dez.\u2009–\u200914. Feb.',
      description: '2025–2026 · Laufen · ca. 10 km',
    });
    expect(zoomTile(criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }))).toBeNull();
    expect(zoomTile(null)).toBeNull();
  });
});
