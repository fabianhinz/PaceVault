import { describe, it, expect, afterEach } from 'vite-plus/test';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import {
  type FilterCriteria,
  emptyCriteria,
  filterKey,
  filterName,
  matchesFilters,
} from '@/lib/savedFilters.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { resolveFilterRange } from '@/lib/timeRange.ts';
import { overwriteGetLocale } from '@pacevault/i18n/runtime.js';

const NOW = new Date(2026, 9, 8, 18, 0).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const session = (
  sport: Sport,
  date: number,
  distance: number,
  duration: number,
  elevationGain: number,
  name?: string,
) => ({ sport, date, distance, duration, elevationGain, isPlanned: false, name });

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({
  ...emptyCriteria(),
  ...overrides,
});

const interpret = (text: string) => interpretFilterText(text, NOW);
const understood = (text: string) => interpret(text)[0] ?? null;

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

  it('offers every plausible reading of a bare number', () => {
    expect(interpret('10')).toEqual([
      criteria({ distance: 10000 }),
      criteria({ duration: 36000 }),
      criteria({ time: { kind: 'relative', amount: 10, unit: 'day' } }),
    ]);
    expect(interpret('letzte 3')).toEqual([
      criteria({ time: { kind: 'relative', amount: 3, unit: 'day' } }),
      criteria({ time: { kind: 'relative', amount: 3, unit: 'week' } }),
      criteria({ time: { kind: 'relative', amount: 3, unit: 'month' } }),
    ]);
    expect(interpret('50')).toEqual([
      criteria({ distance: 50000 }),
      criteria({ time: { kind: 'relative', amount: 50, unit: 'day' } }),
      criteria({ duration: 3000 }),
      criteria({ elevationGain: 50 }),
    ]);
  });

  it('reads calendar years, years, months and month ranges', () => {
    expect(interpret('dieses jahr')).toEqual([
      criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }),
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

  it('suggests what it reads without looking at sessions', () => {
    expect(interpret('')).toEqual([]);
    expect(interpret('xyz')).toEqual([]);
    expect(interpret('3km')).toEqual([criteria({ distance: 3000 })]);
    expect(interpret('bike 2 km')).toEqual([criteria({ sport: 'cycling', distance: 2000 })]);
  });

  it('never reads a typo as a sport', () => {
    for (const typo of ['runing', 'cyclng', 'laufn', 'radfaren']) {
      expect(interpret(typo), typo).toEqual([]);
    }
  });

  it('reads synonyms', () => {
    expect(interpret('biking')).toEqual([criteria({ sport: 'cycling' })]);
    expect(interpret('radfahrt')).toEqual([criteria({ sport: 'cycling' })]);
    expect(interpret('jogging')).toEqual([criteria({ sport: 'running' })]);
  });

  it('reads calendar dates', () => {
    expect(understood('today')).toEqual(
      criteria({ time: { kind: 'calendar', unit: 'day', ago: 0 } }),
    );
    expect(understood('heute')).toEqual(
      criteria({ time: { kind: 'calendar', unit: 'day', ago: 0 } }),
    );
    expect(understood('yesterday')).toEqual(
      criteria({ time: { kind: 'calendar', unit: 'day', ago: 1 } }),
    );
    for (const text of ['this week', 'diese woche']) {
      expect(understood(text), text).toEqual(
        criteria({ time: { kind: 'calendar', unit: 'week', ago: 0 } }),
      );
    }
    for (const text of ['this month', 'diesen monat']) {
      expect(understood(text), text).toEqual(
        criteria({ time: { kind: 'calendar', unit: 'month', ago: 0 } }),
      );
    }
    expect(resolveFilterRange({ kind: 'calendar', unit: 'week', ago: 0 }, NOW)).toEqual({
      from: new Date(2026, 9, 5).getTime(),
      to: new Date(2026, 9, 8, 23, 59, 59, 999).getTime(),
    });
    expect(resolveFilterRange({ kind: 'calendar', unit: 'day', ago: 1 }, NOW)).toEqual({
      from: new Date(2026, 9, 7).getTime(),
      to: new Date(2026, 9, 7, 23, 59, 59, 999).getTime(),
    });
  });

  it('since a month runs until now', () => {
    expect(understood('since march')).toEqual(
      criteria({ time: { kind: 'since', from: '2026-03-01' } }),
    );
    expect(understood('seit märz 2025')).toEqual(
      criteria({ time: { kind: 'since', from: '2025-03-01' } }),
    );
    expect(understood('since nov')).toEqual(
      criteria({ time: { kind: 'since', from: '2025-11-01' } }),
    );
    expect(understood('since 2025')).toEqual(
      criteria({ time: { kind: 'since', from: '2025-01-01' } }),
    );
    expect(resolveFilterRange({ kind: 'since', from: '2026-03-01' }, NOW)).toEqual({
      from: new Date(2026, 2, 1).getTime(),
      to: new Date(2026, 9, 8, 23, 59, 59, 999).getTime(),
    });
  });

  it('last week/month/year are rolling', () => {
    expect(understood('last week')).toEqual(
      criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } }),
    );
    expect(understood('letzten monat')).toEqual(
      criteria({ time: { kind: 'relative', amount: 30, unit: 'day' } }),
    );
    expect(understood('last year')).toEqual(
      criteria({ time: { kind: 'relative', amount: 365, unit: 'day' } }),
    );
    expect(understood('letztes jahr')).toEqual(
      criteria({ time: { kind: 'relative', amount: 365, unit: 'day' } }),
    );
    expect(understood('last 2 years')).toEqual(
      criteria({ time: { kind: 'relative', amount: 2, unit: 'year' } }),
    );
  });

  it('1 year is not the last day', () => {
    expect(understood('1 year')).toEqual(
      criteria({ time: { kind: 'relative', amount: 365, unit: 'day' } }),
    );
    expect(interpret('1 year')).toHaveLength(1);
  });

  it('reads h:mm and compound durations', () => {
    for (const text of ['1:30', '1:30 h', '1h30', '1h30m', '1 h 30', '1 std 30 min']) {
      expect(understood(text), text).toEqual(criteria({ duration: 5400 }));
    }
    expect(understood('2 h 30 min')).toEqual(criteria({ duration: 9000 }));
    expect(understood('1 h 90 min')).toEqual(criteria({ duration: 3600 }));
    expect(understood('1 h 30 km')).toEqual(criteria({ duration: 3600, distance: 30000 }));
    expect(understood('500 m')).toEqual(criteria({ elevationGain: 500 }));
  });

  it('reads k as kilometres', () => {
    expect(interpret('5k')).toEqual([criteria({ distance: 5000 })]);
    expect(interpret('10k run')).toEqual([criteria({ sport: 'running', distance: 10000 })]);
    expect(interpret('3 k')).toEqual([criteria({ distance: 3000 })]);
    expect(interpret('k')).toEqual([]);
  });

  it('never reads repeats like 6x800 as distance and climb', () => {
    for (const text of ['6x800', '6×800', '6 x 800', '6X800 m', '10x1,5']) {
      expect(interpret(text), text).toEqual([]);
    }
    expect(interpret('run 6x800')).toEqual([criteria({ sport: 'running' })]);
  });

  it('10 mi is miles, not minutes', () => {
    expect(understood('10 mi')).toEqual(criteria({ distance: 16100 }));
    expect(understood('10 miles')).toEqual(criteria({ distance: 16100 }));
  });

  it('takes explicit values beyond the bare-number guesses', () => {
    expect(understood('500 km')).toEqual(criteria({ distance: 500000 }));
    expect(understood('2 min')).toEqual(criteria({ duration: 120 }));
  });

  it('never searches session names for unquoted words', () => {
    for (const text of ['herrenalb', 'in herrenalb', 'Isar', 'xyzzy']) {
      expect(interpret(text), text).toEqual([]);
    }
    expect(interpret('Isar run')).toEqual([criteria({ sport: 'running' })]);
  });

  describe('quoted text', () => {
    const NAMED = [
      session('cycling', NOW - 2 * DAY_MS, 50000, 7200, 400, 'Isar Loop'),
      session('running', NOW - 10 * DAY_MS, 12000, 4200, 20, 'Interval Karlsruhe Rheinhafen'),
      session('running', NOW - 12 * DAY_MS, 7000, 2400, 30, 'Zürich Seerunde'),
    ];
    const matchingNames = (text: string) =>
      NAMED.filter((s) => matchesFilters(s, understood(text), NOW)).map((s) => s.name);

    it('searches the session name with single, double and typographic quotes', () => {
      for (const text of [
        '"isar loop"',
        "'isar loop'",
        '„isar loop“',
        '“isar loop”',
        '‘isar loop’',
        '»isar loop«',
      ]) {
        expect(interpret(text), text).toEqual([criteria({ name: 'isar loop' })]);
      }
    });

    it('matches every quoted word in any order, ignoring case and accents', () => {
      expect(matchingNames('"interval karlsruhe"')).toEqual(['Interval Karlsruhe Rheinhafen']);
      expect(matchingNames('"KARLSRUHE Interval"')).toEqual(['Interval Karlsruhe Rheinhafen']);
      expect(matchingNames('"rhein interv"')).toEqual(['Interval Karlsruhe Rheinhafen']);
      expect(matchingNames('"seerunde zurich"')).toEqual(['Zürich Seerunde']);
      expect(matchingNames('"interval zurich"')).toEqual([]);
    });

    it('never reads a quoted sport, date or number', () => {
      expect(interpret('"ride"')).toEqual([criteria({ name: 'ride' })]);
      expect(interpret("'today'")).toEqual([criteria({ name: 'today' })]);
      expect(interpret('"50"')).toEqual([criteria({ name: '50' })]);
      expect(interpret('"6×800 m"')).toEqual([criteria({ name: '6×800 m' })]);
    });

    it('combines quoted phrases with the rest of the query', () => {
      expect(interpret('ride "isar" 50')).toEqual([
        criteria({ sport: 'cycling', name: 'isar', distance: 50000 }),
        criteria({
          sport: 'cycling',
          name: 'isar',
          time: { kind: 'relative', amount: 50, unit: 'day' },
        }),
        criteria({ sport: 'cycling', name: 'isar', duration: 3000 }),
        criteria({ sport: 'cycling', name: 'isar', elevationGain: 50 }),
      ]);
      expect(interpret('"isar" \'loop\'')).toEqual([criteria({ name: 'isar loop' })]);
      expect(interpret('"isar" "track"')).toEqual([criteria({ name: 'isar track' })]);
      expect(interpret('ride xyz "isar"')).toEqual([criteria({ sport: 'cycling', name: 'isar' })]);
    });

    it('reads quoted words it does not know as a name', () => {
      expect(interpret('"runing xyzzy"')).toEqual([criteria({ name: 'runing xyzzy' })]);
    });

    it('reads an unclosed quote as a name while typing', () => {
      expect(interpret('run "6×800')).toEqual([criteria({ sport: 'running', name: '6×800' })]);
      expect(interpret("ride 'isar lo")).toEqual([criteria({ sport: 'cycling', name: 'isar lo' })]);
    });

    it('ignores empty quotes', () => {
      expect(interpret('run ""')).toEqual(interpret('run'));
      expect(interpret("'' ride")).toEqual(interpret('ride'));
      expect(understood('"  "')).toBeNull();
      expect(understood('"')).toBeNull();
    });

    it('does not open a quote at an apostrophe inside a word', () => {
      expect(interpret("Fabian's run")).toEqual([criteria({ sport: 'running' })]);
      expect(interpret("'Fabian's long run'")).toEqual([criteria({ name: "fabian's long run" })]);
      expect(understood("don't 50")).toEqual(criteria({ distance: 50000 }));
    });
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
      criteria({ time: { kind: 'calendar', unit: 'day', ago: 0 } }),
      criteria({ time: { kind: 'calendar', unit: 'day', ago: 1 } }),
      criteria({ time: { kind: 'calendar', unit: 'week', ago: 0 } }),
      criteria({ time: { kind: 'calendar', unit: 'month', ago: 0 } }),
      criteria({ time: { kind: 'since', from: '2026-03-01' } }),
      criteria({ time: { kind: 'since', from: '2025-01-01' } }),
      criteria({ time: { kind: 'relative', amount: 365, unit: 'day' } }),
      criteria({ time: { kind: 'relative', amount: 2, unit: 'year' } }),
      criteria({ sport: 'running', distance: 16100 }),
      criteria({ sport: 'running', name: 'herrenalb' }),
      criteria({ name: 'isar run' }),
    ];

    for (const locale of ['de', 'en'] as const) {
      it(`reads its own names back in ${locale}`, () => {
        overwriteGetLocale(() => locale);
        for (const filter of filters) {
          const first = understood(filterName(filter));
          expect(first && filterKey(first), filterName(filter)).toBe(filterKey(filter));
        }
      });
    }
  });
});
