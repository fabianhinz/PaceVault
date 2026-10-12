import { describe, it, expect, afterEach } from 'vitest';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import { type FilterCriteria, emptyCriteria, filterKey, filterName } from '@/lib/savedFilters.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { resolveFilterRange } from '@/lib/timeRange.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';

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

const SESSIONS = [
  session('running', NOW - 2 * DAY_MS, 10000, 3600, 100, 'Bad Herrenalb Trailrunning'),
  session('running', NOW - 3 * DAY_MS, 12000, 4000, 80, 'Isar intervals'),
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

const read = (text: string) => interpretFilterText(text, SESSIONS, NOW);
const interpret = (text: string) => read(text).interpretations;
const understood = (text: string) => read(text).understood;

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

  it('tells text it cannot read apart from text that matches no session', () => {
    expect(read('')).toEqual({ interpretations: [], understood: null });
    expect(read('xyz')).toEqual({ interpretations: [], understood: null });
    const noMatch = read('bike 2 km');
    expect(noMatch.interpretations).toEqual([]);
    expect(noMatch.understood).toEqual(criteria({ sport: 'cycling', distance: 2000 }));
  });

  it('only counts recorded sessions as matches', () => {
    const planned = [{ ...session('running', NOW, 10000, 3600, 100), isPlanned: true }];
    expect(interpretFilterText('laufen', planned, NOW).interpretations).toEqual([]);
  });

  it('never reads a typo as a sport', () => {
    for (const typo of ['runing', 'cyclng', 'laufn', 'radfaren']) {
      const reading = read(typo);
      expect(reading.understood, typo).toBeNull();
      expect(reading.interpretations, typo).toEqual([]);
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
    expect(read('1 year').interpretations).toHaveLength(1);
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

  it('10 mi is miles, not minutes', () => {
    expect(understood('10 mi')).toEqual(criteria({ distance: 16100 }));
    expect(understood('10 miles')).toEqual(criteria({ distance: 16100 }));
  });

  it('takes explicit values beyond the bare-number guesses', () => {
    expect(understood('500 km')).toEqual(criteria({ distance: 500000 }));
    expect(understood('2 min')).toEqual(criteria({ duration: 120 }));
  });

  it('leftover words search session names', () => {
    expect(interpret('herrenalb')).toEqual([criteria({ name: 'herrenalb' })]);
    expect(interpret('Isar run')).toEqual([criteria({ sport: 'running', name: 'isar' })]);
    expect(interpret('herrenalb isar')).toEqual([]);
    expect(interpret('in herrenalb')).toEqual([criteria({ name: 'herrenalb' })]);
    expect(understood('xyzzy')).toBeNull();
  });

  describe('quoted text', () => {
    const NAMED = [
      session('cycling', NOW - 2 * DAY_MS, 50000, 7200, 400, 'Isar Loop'),
      session('running', NOW - 4 * DAY_MS, 8000, 2700, 40, 'Ride to work today 50'),
      session('running', NOW - 6 * DAY_MS, 9000, 3000, 30, '6×800 m on the track'),
      session('running', NOW - 8 * DAY_MS, 10000, 3600, 60, "Fabian's long run"),
    ];
    const readNamed = (text: string) => interpretFilterText(text, NAMED, NOW);

    it('searches the session name with single, double and typographic quotes', () => {
      for (const text of [
        '"isar loop"',
        "'isar loop'",
        '„isar loop“',
        '“isar loop”',
        '‘isar loop’',
        '»isar loop«',
      ]) {
        expect(readNamed(text).interpretations, text).toEqual([criteria({ name: 'isar loop' })]);
      }
    });

    it('never reads a quoted sport, date or number', () => {
      expect(readNamed('"ride"').interpretations).toEqual([criteria({ name: 'ride' })]);
      expect(readNamed("'today'").interpretations).toEqual([criteria({ name: 'today' })]);
      expect(readNamed('"50"').interpretations).toEqual([criteria({ name: '50' })]);
      expect(readNamed('"6×800 m"').interpretations).toEqual([criteria({ name: '6×800 m' })]);
    });

    it('combines quoted phrases with the rest of the query', () => {
      expect(readNamed('ride "isar" 50').interpretations).toEqual([
        criteria({ sport: 'cycling', name: 'isar', distance: 50000 }),
        criteria({
          sport: 'cycling',
          name: 'isar',
          time: { kind: 'relative', amount: 50, unit: 'day' },
        }),
      ]);
      expect(readNamed('"isar" \'loop\'').interpretations).toEqual([
        criteria({ name: 'isar loop' }),
      ]);
      expect(readNamed('"isar" "track"').interpretations).toEqual([]);
    });

    it('reads quoted words it does not know as a name', () => {
      const reading = readNamed('"runing xyzzy"');
      expect(reading.understood).toEqual(criteria({ name: 'runing xyzzy' }));
      expect(reading.interpretations).toEqual([]);
    });

    it('reads an unclosed quote as a name while typing', () => {
      expect(readNamed('run "6×800').interpretations).toEqual([
        criteria({ sport: 'running', name: '6×800' }),
      ]);
      expect(readNamed("ride 'isar lo").interpretations).toEqual([
        criteria({ sport: 'cycling', name: 'isar lo' }),
      ]);
    });

    it('ignores empty quotes', () => {
      expect(readNamed('run ""').interpretations).toEqual(readNamed('run').interpretations);
      expect(readNamed("'' ride").interpretations).toEqual(readNamed('ride').interpretations);
      expect(readNamed('"  "').understood).toBeNull();
      expect(readNamed('"').understood).toBeNull();
    });

    it('does not open a quote at an apostrophe inside a word', () => {
      expect(readNamed("Fabian's run").interpretations).toEqual([
        criteria({ sport: 'running', name: "fabian's" }),
      ]);
      expect(readNamed("'Fabian's long run'").interpretations).toEqual([
        criteria({ name: "fabian's long run" }),
      ]);
      expect(readNamed("don't 50").understood).toEqual(criteria({ distance: 50000 }));
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
