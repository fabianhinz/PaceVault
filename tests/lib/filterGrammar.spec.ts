import { describe, it, expect, afterEach } from 'vitest';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import { type FilterCriteria, emptyCriteria, filterKey, filterName } from '@/lib/savedFilters.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';

const NOW = new Date(2026, 9, 8, 18, 0).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const session = (
  sport: Sport,
  date: number,
  distance: number,
  duration: number,
  elevationGain: number,
) => ({ sport, date, distance, duration, elevationGain, isPlanned: false });

const SESSIONS = [
  session('running', NOW - 2 * DAY_MS, 10000, 3600, 100),
  session('running', NOW - 20 * DAY_MS, 21000, 7200, 250),
  session('cycling', NOW - 5 * DAY_MS, 50000, 7200, 500),
  session('cycling', new Date(2026, 8, 14).getTime(), 80000, 10800, 2000),
  session('running', new Date(2025, 10, 20).getTime(), 8000, 2700, 60),
  session('cycling', new Date(2025, 5, 1).getTime(), 40000, 5400, 300),
];

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({
  ...emptyCriteria(),
  ...overrides,
});

const interpret = (text: string) => interpretFilterText(text, SESSIONS, NOW);

describe('interpretFilterText', () => {
  it('reads a German sport with a relative range', () => {
    expect(interpret('laufen 30 tage')).toEqual([
      criteria({ sport: 'running', time: { kind: 'relative', amount: 30, unit: 'day' } }),
    ]);
  });

  it('reads English synonyms and combines criteria', () => {
    expect(interpret('run last 30 days 10 km')).toEqual([
      criteria({
        sport: 'running',
        time: { kind: 'relative', amount: 30, unit: 'day' },
        distance: 10000,
      }),
    ]);
    expect(interpret('bike ~50km')).toEqual([criteria({ sport: 'cycling', distance: 50000 })]);
  });

  it('maps units to distance, duration and elevation', () => {
    expect(interpret('90 min')).toEqual([criteria({ duration: 5400 })]);
    expect(interpret('ca. 1,5 h')).toEqual([criteria({ duration: 5400 })]);
    expect(interpret('etwa 500 hm')).toEqual([criteria({ elevationGain: 500 })]);
    expect(interpret('2000 hm')).toEqual([criteria({ elevationGain: 2000 })]);
  });

  it('offers the plausible readings of a bare number', () => {
    expect(interpret('10')).toEqual([
      criteria({ distance: 10000 }),
      criteria({ time: { kind: 'relative', amount: 10, unit: 'day' } }),
    ]);
    expect(interpret('letzte 3')).toEqual([
      criteria({ time: { kind: 'relative', amount: 3, unit: 'day' } }),
      criteria({ time: { kind: 'relative', amount: 3, unit: 'week' } }),
      criteria({ time: { kind: 'relative', amount: 3, unit: 'month' } }),
    ]);
  });

  it('reads calendar years, years, months and month ranges', () => {
    expect(interpret('dieses jahr')).toEqual([
      criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }),
    ]);
    expect(interpret('last year')).toEqual([
      criteria({ time: { kind: 'calendarYear', yearsAgo: 1 } }),
    ]);
    expect(interpret('2025')).toEqual([
      criteria({ time: { kind: 'range', from: '2025-01-01', to: '2025-12-31', source: 'year' } }),
    ]);
    expect(interpret('sep')).toEqual([
      criteria({ time: { kind: 'range', from: '2026-09-01', to: '2026-09-30', source: 'month' } }),
    ]);
    expect(interpret('nov')).toEqual([
      criteria({ time: { kind: 'range', from: '2025-11-01', to: '2025-11-30', source: 'month' } }),
    ]);
    expect(interpret('sep–okt')).toEqual([
      criteria({ time: { kind: 'range', from: '2026-09-01', to: '2026-10-31', source: 'months' } }),
    ]);
    expect(interpret('nov feb')).toEqual([
      criteria({ time: { kind: 'range', from: '2025-11-01', to: '2026-02-28', source: 'months' } }),
    ]);
  });

  it('shows nothing for text it cannot read or that matches no session', () => {
    expect(interpret('')).toEqual([]);
    expect(interpret('xyz')).toEqual([]);
    expect(interpret('bike 2 km')).toEqual([]);
  });

  it('only counts recorded sessions as matches', () => {
    const planned = [{ ...session('running', NOW, 10000, 3600, 100), isPlanned: true }];
    expect(interpretFilterText('laufen', planned, NOW)).toEqual([]);
  });

  describe('round trip of generated names', () => {
    afterEach(() => {
      overwriteGetLocale(() => 'en');
    });

    const filters = [
      criteria({
        sport: 'running',
        time: { kind: 'relative', amount: 30, unit: 'day' },
        distance: 10000,
      }),
      criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } }),
      criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }),
      criteria({ sport: 'cycling', duration: 5400 }),
      criteria({ sport: 'running', duration: 2700 }),
      criteria({ elevationGain: 2000 }),
      criteria({ time: { kind: 'range', from: '2025-01-01', to: '2025-12-31', source: 'year' } }),
      criteria({ time: { kind: 'range', from: '2026-09-01', to: '2026-09-30', source: 'month' } }),
      criteria({ time: { kind: 'range', from: '2026-09-01', to: '2026-10-31', source: 'months' } }),
      criteria({ time: { kind: 'range', from: '2025-11-01', to: '2026-02-28', source: 'months' } }),
    ];

    for (const locale of ['de', 'en'] as const) {
      it(`reads its own names back in ${locale}`, () => {
        overwriteGetLocale(() => locale);
        for (const filter of filters) {
          const first = interpret(filterName(filter))[0];
          expect(first && filterKey(first), filterName(filter)).toBe(filterKey(filter));
        }
      });
    }
  });
});
