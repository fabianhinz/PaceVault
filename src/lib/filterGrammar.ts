import type { Sport, TrainingSession } from '@/packages/engine/types.ts';
import { type FilterTime, type FilterTimeUnit, toDayKey } from '@/lib/timeRange.ts';
import {
  type FilterCriteria,
  emptyCriteria,
  filterKey,
  isEmptyCriteria,
  matchesFilters,
} from '@/lib/savedFilters.ts';

type GrammarSession = Pick<
  TrainingSession,
  'sport' | 'date' | 'duration' | 'distance' | 'elevationGain' | 'isPlanned'
>;

type QuantityUnit = 'km' | 'h' | 'min' | 'hm';
type Unit = QuantityUnit | 'd' | 'w' | 'm';

const MAX_INTERPRETATIONS = 3;

const KEYWORDS = {
  approx: [
    'ca',
    'circa',
    'etwa',
    'ungefähr',
    'rund',
    'about',
    'around',
    'approx',
    'roughly',
    '~',
    '≈',
  ],
  km: ['km', 'kilometer'],
  h: ['h', 'std', 'stunde', 'stunden', 'hour', 'hours', 'hr'],
  min: ['min', 'minute', 'minuten', 'minutes', 'mins'],
  hm: ['hm', 'höhenmeter', 'hoehenmeter', 'm', 'climb', 'elevation'],
  d: ['tag', 'tage', 'tagen', 'd', 't', 'day', 'days'],
  w: ['woche', 'wochen', 'w', 'week', 'weeks'],
  m: ['monat', 'monate', 'monaten', 'month', 'months', 'mo'],
  relative: ['letzte', 'letzten', 'letzter', 'vergangene', 'vergangenen', 'last', 'past'],
  year: ['jahr', 'year'],
  thisYear: ['dieses', 'diesem', 'this'],
  lastYear: ['letztes', 'letzten', 'vergangenes', 'last'],
  running: ['laufen', 'lauf', 'läufe', 'joggen', 'run', 'running', 'runs', 'jog'],
  cycling: [
    'rad',
    'radfahren',
    'radeln',
    'fahrrad',
    'ausfahrt',
    'bike',
    'ride',
    'rides',
    'cycling',
  ],
} satisfies Record<string, string[]>;

const EXACT_UNIT_ORDER: Unit[] = ['km', 'h', 'min', 'hm', 'd', 'w', 'm'];
const PREFIX_UNIT_ORDER: Unit[] = ['d', 'w', 'm', 'km', 'min', 'h', 'hm'];
const SPORT_ORDER: Sport[] = ['running', 'cycling'];

const MONTH_NAMES: string[][] = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(2026, index, 15);
  const names = ['de-DE', 'en-GB'].flatMap((locale) =>
    (['long', 'short'] as const).map((month) =>
      new Intl.DateTimeFormat(locale, { month }).format(date).toLowerCase().replace('.', ''),
    ),
  );
  if (index === 2) {
    names.push('maerz');
  }
  return [...new Set(names)];
});

const UNIT_LIMITS: Record<QuantityUnit, (n: number) => boolean> = {
  km: (n) => n > 0 && n <= 400,
  h: (n) => n > 0 && n <= 24,
  min: (n) => n >= 5 && n <= 600,
  hm: (n) => n >= 50 && n <= 10000,
};

const RELATIVE_LIMITS: Record<FilterTimeUnit, number> = { day: 365, week: 104, month: 36 };

const RELATIVE_UNITS: Record<'d' | 'w' | 'm', FilterTimeUnit> = { d: 'day', w: 'week', m: 'month' };

const isNumberWord = (word: string): boolean => /^\d+(?:[.,]\d+)?$/.test(word);

const toNumber = (word: string): number => Number(word.replace(',', '.'));

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/·/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/(\d)([^\d\s.,])/g, '$1 $2')
    .replace(/([^\d\s.,])(\d)/g, '$1 $2')
    .replace(/([~≈-])/g, ' $1 ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

const unitOf = (word: string | undefined): Unit | null => {
  if (word === undefined || isNumberWord(word)) {
    return null;
  }
  const exact = EXACT_UNIT_ORDER.find((unit) => KEYWORDS[unit].includes(word));
  if (exact !== undefined) {
    return exact;
  }
  if (word.length < 2) {
    return null;
  }
  const prefixed = PREFIX_UNIT_ORDER.find((unit) =>
    KEYWORDS[unit].some((keyword) => keyword.length >= 3 && keyword.startsWith(word)),
  );
  return prefixed ?? null;
};

const sportOf = (word: string): Sport | null => {
  const sport = SPORT_ORDER.find(
    (candidate) =>
      KEYWORDS[candidate].includes(word) ||
      (word.length >= 3 && KEYWORDS[candidate].some((keyword) => keyword.startsWith(word))),
  );
  return sport ?? null;
};

const monthOf = (word: string): number => {
  if (word.length < 3) {
    return -1;
  }
  return MONTH_NAMES.findIndex((names) => names.some((name) => name.startsWith(word)));
};

const isYearWord = (word: string | undefined): boolean =>
  word !== undefined &&
  !isNumberWord(word) &&
  KEYWORDS.year.some((keyword) => keyword.startsWith(word));

const isRelativeUnit = (unit: Unit | null): unit is 'd' | 'w' | 'm' =>
  unit === 'd' || unit === 'w' || unit === 'm';

const relativeTime = (amount: number, unit: FilterTimeUnit): FilterTime | null => {
  if (!Number.isInteger(amount) || amount <= 0 || amount > RELATIVE_LIMITS[unit]) {
    return null;
  }
  return { kind: 'relative', amount, unit };
};

const yearRange = (year: number): FilterTime => ({
  kind: 'range',
  from: toDayKey(year, 0, 1),
  to: toDayKey(year, 11, 31),
  source: 'year',
});

const monthRange = (year: number, month: number): FilterTime => ({
  kind: 'range',
  from: toDayKey(year, month, 1),
  to: toDayKey(year, month + 1, 0),
  source: 'month',
});

const monthsRange = (year: number, first: number, last: number): FilterTime => {
  let fromYear = year;
  if (last < first) {
    fromYear = year - 1;
  }
  return {
    kind: 'range',
    from: toDayKey(fromYear, first, 1),
    to: toDayKey(year, last + 1, 0),
    source: 'months',
  };
};

type QuantityKind = 'distance' | 'duration' | 'elevationGain';

const quantity = (unit: QuantityUnit, n: number): { kind: QuantityKind; target: number } | null => {
  if (!UNIT_LIMITS[unit](n)) {
    return null;
  }
  if (unit === 'km') {
    return { kind: 'distance', target: Math.round(n * 10) * 100 };
  }
  if (unit === 'h') {
    return { kind: 'duration', target: Math.round(n * 10) * 360 };
  }
  if (unit === 'min') {
    return { kind: 'duration', target: Math.round(n) * 60 };
  }
  return { kind: 'elevationGain', target: Math.round(n) };
};

interface Ambiguous {
  n: number;
  relative: boolean;
}

type Alternative = { kind: 'time'; time: FilterTime } | { kind: QuantityKind; target: number };

const withAlternative = (criteria: FilterCriteria, alternative: Alternative): FilterCriteria => {
  const next = { ...criteria };
  if (alternative.kind === 'time') {
    next.time = alternative.time;
  } else {
    next[alternative.kind] = alternative.target;
  }
  return next;
};

const isFree = (criteria: FilterCriteria, kind: Alternative['kind']): boolean =>
  criteria[kind] === null;

const alternativesFor = (ambiguous: Ambiguous, criteria: FilterCriteria): Alternative[] => {
  const out: Alternative[] = [];
  const addTime = (time: FilterTime | null) => {
    if (time !== null && isFree(criteria, 'time')) {
      out.push({ kind: 'time', time });
    }
  };
  const addQuantity = (unit: QuantityUnit) => {
    const parsed = quantity(unit, ambiguous.n);
    if (parsed !== null && isFree(criteria, parsed.kind)) {
      out.push(parsed);
    }
  };
  if (ambiguous.relative) {
    addTime(relativeTime(ambiguous.n, 'day'));
    addTime(relativeTime(ambiguous.n, 'week'));
    addTime(relativeTime(ambiguous.n, 'month'));
    return out;
  }
  addQuantity('km');
  addQuantity('h');
  addTime(relativeTime(ambiguous.n, 'day'));
  if (ambiguous.n > 24) {
    addQuantity('min');
  }
  addQuantity('hm');
  return out;
};

const parse = (text: string, now: number): FilterCriteria[] => {
  const words = tokenize(text);
  const fixed = emptyCriteria();
  const ambiguous: Ambiguous[] = [];
  const months: number[] = [];
  let explicitYear: number | null = null;
  const currentYear = new Date(now).getFullYear();
  const currentMonth = new Date(now).getMonth();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === undefined || KEYWORDS.approx.includes(word) || word === '-') {
      continue;
    }
    if (isNumberWord(word)) {
      const n = toNumber(word);
      const unit = unitOf(words[i + 1]);
      if (unit !== null) {
        i++;
        if (isRelativeUnit(unit)) {
          const time = relativeTime(n, RELATIVE_UNITS[unit]);
          if (time !== null) {
            fixed.time = time;
          }
        } else if (unit === 'km' || unit === 'h' || unit === 'min' || unit === 'hm') {
          const parsed = quantity(unit, n);
          if (parsed !== null) {
            fixed[parsed.kind] = parsed.target;
          }
        }
        continue;
      }
      if (/^\d{4}$/.test(word) && n >= 1990 && n <= currentYear) {
        explicitYear = n;
        continue;
      }
      ambiguous.push({ n, relative: KEYWORDS.relative.includes(words[i - 1] ?? '') });
      continue;
    }
    const isRelative = KEYWORDS.relative.includes(word);
    const isThisYear = KEYWORDS.thisYear.includes(word);
    if (isRelative || isThisYear || KEYWORDS.lastYear.includes(word)) {
      const next = words[i + 1];
      if (isYearWord(next)) {
        let yearsAgo = 1;
        if (isThisYear) {
          yearsAgo = 0;
        }
        fixed.time = { kind: 'calendarYear', yearsAgo };
        i++;
        continue;
      }
      const unit = unitOf(next);
      if (isRelative && isRelativeUnit(unit)) {
        fixed.time = { kind: 'relative', amount: 1, unit: RELATIVE_UNITS[unit] };
        i++;
      }
      continue;
    }
    const month = monthOf(word);
    if (month >= 0) {
      months.push(month);
      continue;
    }
    const sport = sportOf(word);
    if (sport !== null) {
      fixed.sport = sport;
    }
  }

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  if (firstMonth !== undefined && lastMonth !== undefined) {
    let year = explicitYear;
    if (year === null) {
      year = currentYear;
      if (lastMonth > currentMonth) {
        year = currentYear - 1;
      }
    }
    if (months.length >= 2) {
      fixed.time = monthsRange(year, firstMonth, lastMonth);
    } else {
      fixed.time = monthRange(year, lastMonth);
    }
  } else if (explicitYear !== null) {
    fixed.time = yearRange(explicitYear);
  }

  let combos: FilterCriteria[] = [fixed];
  for (const entry of ambiguous) {
    const next = combos.flatMap((criteria) =>
      alternativesFor(entry, criteria).map((alternative) => withAlternative(criteria, alternative)),
    );
    if (next.length > 0) {
      combos = next;
    }
  }
  return combos;
};

export const interpretFilterText = (
  text: string,
  sessions: GrammarSession[],
  now: number,
): FilterCriteria[] => {
  const seen = new Set<string>();
  const result: FilterCriteria[] = [];
  for (const criteria of parse(text, now)) {
    if (isEmptyCriteria(criteria)) {
      continue;
    }
    const key = filterKey(criteria);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (!sessions.some((session) => !session.isPlanned && matchesFilters(session, criteria, now))) {
      continue;
    }
    result.push(criteria);
    if (result.length === MAX_INTERPRETATIONS) {
      break;
    }
  }
  return result;
};
