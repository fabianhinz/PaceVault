import type { Sport } from '@/packages/engine/types.ts';
import { type FilterTime, type FilterTimeUnit, toDayKey } from '@/lib/timeRange.ts';
import {
  type FilterCriteria,
  emptyCriteria,
  filterKey,
  isEmptyCriteria,
} from '@/lib/savedFilters.ts';
import {
  EXACT_ONLY_UNITS,
  EXACT_UNIT_ORDER,
  KEYWORDS,
  MONTH_NAMES,
  PREFIX_UNIT_ORDER,
  type QuantityUnit,
  type Unit,
} from '@/lib/filterVocabulary.ts';

interface Token {
  word: string;
  quoted: boolean;
}

const MILE_KM = 1.609;

const GUESS_LIMITS: Record<QuantityUnit, (n: number) => boolean> = {
  km: (n) => n > 0 && n <= 400,
  mi: (n) => n > 0 && n <= 250,
  h: (n) => n > 0 && n <= 24,
  min: (n) => n >= 5 && n <= 600,
  hm: (n) => n >= 50 && n <= 10000,
};

const GUESS_RELATIVE_LIMITS: Record<FilterTimeUnit, number> = {
  day: 365,
  week: 104,
  month: 36,
  year: 10,
};

const EXPLICIT_RELATIVE_LIMITS: Record<FilterTimeUnit, number> = {
  day: 3653,
  week: 522,
  month: 120,
  year: 10,
};

const RELATIVE_UNITS: Record<'d' | 'w' | 'm' | 'y', FilterTimeUnit> = {
  d: 'day',
  w: 'week',
  m: 'month',
  y: 'year',
};

const ROLLING_DAYS: Record<'d' | 'w' | 'm' | 'y', number> = { d: 1, w: 7, m: 30, y: 365 };

const SPORT_ORDER: Sport[] = ['running', 'cycling'];

const isNumberWord = (word: string): boolean => /^\d+(?:[.,]\d+)?$/.test(word);

const CLOCK_PATTERN = /^(\d{1,2}):([0-5]\d)$/;

const REPEATS_PATTERN = /(?<![\d.,])\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?!\d)/giu;

const toNumber = (word: string): number => Number(word.replace(',', '.'));

interface QuotePair {
  open: string;
  close: string;
  bounded: boolean;
}

const QUOTES: QuotePair[] = [
  { open: '"', close: '"', bounded: false },
  { open: "'", close: "'", bounded: true },
];

const TYPOGRAPHIC_QUOTES: QuotePair[] = [
  { open: '„', close: '“', bounded: false },
  { open: '“', close: '”', bounded: false },
  { open: '‘', close: '’', bounded: true },
  { open: '»', close: '«', bounded: false },
];

const QUOTE_PAIRS = [...QUOTES, ...TYPOGRAPHIC_QUOTES];

interface Segment {
  text: string;
  quoted: boolean;
}

const isBoundary = (char: string | undefined): boolean => char === undefined || /\s/.test(char);

const closingIndex = (text: string, from: number, pair: QuotePair): number => {
  for (let i = from; i < text.length; i++) {
    if (text[i] === pair.close && (!pair.bounded || isBoundary(text[i + 1]))) {
      return i;
    }
  }
  return text.length;
};

const splitQuoted = (text: string): Segment[] => {
  const segments: Segment[] = [];
  let plain = '';
  let i = 0;
  while (i < text.length) {
    const char = text[i] ?? '';
    const pair = QUOTE_PAIRS.find((candidate) => candidate.open === char);
    if (pair === undefined || (pair.bounded && !isBoundary(text[i - 1]))) {
      plain += char;
      i++;
      continue;
    }
    const end = closingIndex(text, i + 1, pair);
    segments.push({ text: plain, quoted: false });
    segments.push({ text: text.slice(i + 1, end), quoted: true });
    plain = '';
    i = end + 1;
  }
  segments.push({ text: plain, quoted: false });
  return segments;
};

const tokenizePlain = (text: string): Token[] =>
  text
    .replace(REPEATS_PATTERN, ' ')
    .replace(/["“”„‘»«]|(?<!\p{L})['’]|['’](?!\p{L})/gu, ' ')
    .replace(/[–—]/g, '-')
    .replace(/·/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/:(?!\d)/g, ' ')
    .replace(/(?<!\d):/g, ' ')
    .replace(/(\d)([^\d\s.,:])/g, '$1 $2')
    .replace(/([^\d\s.,:])(\d)/g, '$1 $2')
    .replace(/([~≈-])/g, ' $1 ')
    .split(/\s+/)
    .filter((raw) => raw.length > 0)
    .map((raw) => ({ word: raw.toLowerCase(), quoted: false }));

const tokenize = (text: string): Token[] =>
  splitQuoted(text).flatMap((segment) => {
    if (!segment.quoted) {
      return tokenizePlain(segment.text);
    }
    const phrase = segment.text.trim().split(/\s+/).join(' ');
    if (phrase === '') {
      return [];
    }
    return [{ word: phrase.toLowerCase(), quoted: true }];
  });

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
  const prefixed = PREFIX_UNIT_ORDER.find(
    (unit) =>
      !EXACT_ONLY_UNITS.includes(unit) &&
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

const monthOf = (word: string | undefined): number => {
  if (word === undefined || word.length < 3) {
    return -1;
  }
  return MONTH_NAMES.findIndex((names) => names.some((name) => name.startsWith(word)));
};

const isYearWord = (word: string | undefined): boolean =>
  word !== undefined &&
  !isNumberWord(word) &&
  KEYWORDS.year.some((keyword) => keyword.startsWith(word));

const isRelativeUnit = (unit: Unit | null): unit is 'd' | 'w' | 'm' | 'y' =>
  unit === 'd' || unit === 'w' || unit === 'm' || unit === 'y';

const isQuantityUnit = (unit: Unit | null): unit is QuantityUnit =>
  unit === 'km' || unit === 'mi' || unit === 'h' || unit === 'min' || unit === 'hm';

const relativeTime = (
  amount: number,
  unit: FilterTimeUnit,
  limits: Record<FilterTimeUnit, number>,
): FilterTime | null => {
  if (!Number.isInteger(amount) || amount <= 0 || amount > limits[unit]) {
    return null;
  }
  if (unit === 'year' && amount === 1) {
    return { kind: 'relative', amount: 365, unit: 'day' };
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

interface Quantity {
  kind: QuantityKind;
  target: number;
}

const toQuantity = (unit: QuantityUnit, n: number): Quantity => {
  if (unit === 'km') {
    return { kind: 'distance', target: Math.round(n * 10) * 100 };
  }
  if (unit === 'mi') {
    return { kind: 'distance', target: Math.round(n * MILE_KM * 10) * 100 };
  }
  if (unit === 'h') {
    return { kind: 'duration', target: Math.round(n * 10) * 360 };
  }
  if (unit === 'min') {
    return { kind: 'duration', target: Math.round(n) * 60 };
  }
  return { kind: 'elevationGain', target: Math.round(n) };
};

const guessQuantity = (unit: QuantityUnit, n: number): Quantity | null => {
  if (!GUESS_LIMITS[unit](n)) {
    return null;
  }
  return toQuantity(unit, n);
};

const explicitQuantity = (unit: QuantityUnit, n: number, unitWord: string): Quantity | null => {
  if (n <= 0) {
    return null;
  }
  if (unitWord === 'm' && n < 50) {
    return null;
  }
  const parsed = toQuantity(unit, n);
  if (parsed.target <= 0) {
    return null;
  }
  return parsed;
};

interface Ambiguous {
  n: number;
  relative: boolean;
}

type Alternative = { kind: 'time'; time: FilterTime } | Quantity;

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
    const parsed = guessQuantity(unit, ambiguous.n);
    if (parsed !== null && isFree(criteria, parsed.kind)) {
      out.push(parsed);
    }
  };
  if (ambiguous.relative) {
    addTime(relativeTime(ambiguous.n, 'day', GUESS_RELATIVE_LIMITS));
    addTime(relativeTime(ambiguous.n, 'week', GUESS_RELATIVE_LIMITS));
    addTime(relativeTime(ambiguous.n, 'month', GUESS_RELATIVE_LIMITS));
    return out;
  }
  addQuantity('km');
  addQuantity('h');
  addTime(relativeTime(ambiguous.n, 'day', GUESS_RELATIVE_LIMITS));
  if (ambiguous.n > 24) {
    addQuantity('min');
  }
  addQuantity('hm');
  return out;
};

const compoundMinutes = (
  words: string[],
  index: number,
): { value: number; consumed: number } | null => {
  const word = words[index];
  if (word === undefined || !/^\d{1,2}$/.test(word)) {
    return null;
  }
  const value = Number(word);
  if (value >= 60) {
    return null;
  }
  const unitWord = words[index + 1];
  if (unitWord === 'm' || unitOf(unitWord) === 'min') {
    return { value, consumed: 2 };
  }
  if (unitOf(unitWord) === null) {
    return { value, consumed: 1 };
  }
  return null;
};

interface ParseResult {
  combos: FilterCriteria[];
  names: string[];
}

const parse = (text: string, now: number): ParseResult => {
  const tokens = tokenize(text);
  const words = tokens.map((token) => {
    if (token.quoted) {
      return '';
    }
    return token.word;
  });
  const fixed = emptyCriteria();
  const ambiguous: Ambiguous[] = [];
  const months: number[] = [];
  const years: Token[] = [];
  const names: string[] = [];
  const currentYear = new Date(now).getFullYear();
  const currentMonth = new Date(now).getMonth();

  const setTime = (time: FilterTime | null) => {
    if (time !== null && fixed.time === null) {
      fixed.time = time;
    }
  };

  const setQuantity = (parsed: Quantity | null) => {
    if (parsed !== null && fixed[parsed.kind] === null) {
      fixed[parsed.kind] = parsed.target;
    }
  };

  const inferYear = (month: number): number => {
    if (month > currentMonth) {
      return currentYear - 1;
    }
    return currentYear;
  };

  const isPastYear = (word: string | undefined): boolean => {
    if (word === undefined || !/^\d{4}$/.test(word)) {
      return false;
    }
    const n = Number(word);
    return n >= 1990 && n <= currentYear;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) {
      continue;
    }
    if (token.quoted) {
      names.push(token.word);
      continue;
    }
    const word = token.word;
    if (KEYWORDS.approx.includes(word) || word === '-') {
      continue;
    }

    const clock = CLOCK_PATTERN.exec(word);
    if (clock !== null) {
      if (unitOf(words[i + 1]) === 'h') {
        i++;
      }
      const seconds = Number(clock[1]) * 3600 + Number(clock[2]) * 60;
      let parsed: Quantity | null = null;
      if (seconds > 0) {
        parsed = { kind: 'duration', target: seconds };
      }
      setQuantity(parsed);
      continue;
    }

    if (isNumberWord(word)) {
      const n = toNumber(word);
      const unitWord = words[i + 1];
      const unit = unitOf(unitWord);
      if (unit !== null && unitWord !== undefined) {
        i++;
        if (isRelativeUnit(unit)) {
          setTime(relativeTime(n, RELATIVE_UNITS[unit], EXPLICIT_RELATIVE_LIMITS));
          continue;
        }
        if (unit === 'h' && Number.isInteger(n) && n > 0) {
          const minutes = compoundMinutes(words, i + 1);
          if (minutes !== null) {
            i += minutes.consumed;
            setQuantity({ kind: 'duration', target: n * 3600 + minutes.value * 60 });
            continue;
          }
        }
        if (isQuantityUnit(unit)) {
          setQuantity(explicitQuantity(unit, n, unitWord));
        }
        continue;
      }
      if (isPastYear(word)) {
        years.push(token);
        continue;
      }
      ambiguous.push({
        n,
        relative: KEYWORDS.relative.includes(words[i - 1] ?? ''),
      });
      continue;
    }

    if (KEYWORDS.today.includes(word)) {
      setTime({ kind: 'calendar', unit: 'day', ago: 0 });
      continue;
    }
    if (KEYWORDS.yesterday.includes(word)) {
      setTime({ kind: 'calendar', unit: 'day', ago: 1 });
      continue;
    }

    const next = words[i + 1];
    if (KEYWORDS.this.includes(word)) {
      const unit = unitOf(next);
      if (isYearWord(next)) {
        i++;
        setTime({ kind: 'calendarYear', yearsAgo: 0 });
        continue;
      }
      if (unit === 'w' || unit === 'm') {
        i++;
        let calendarUnit: 'week' | 'month' = 'month';
        if (unit === 'w') {
          calendarUnit = 'week';
        }
        setTime({ kind: 'calendar', unit: calendarUnit, ago: 0 });
      }
      continue;
    }

    if (KEYWORDS.relative.includes(word)) {
      const unit = unitOf(next);
      if (isYearWord(next)) {
        i++;
        setTime({ kind: 'relative', amount: 365, unit: 'day' });
        continue;
      }
      if (isRelativeUnit(unit)) {
        i++;
        setTime({ kind: 'relative', amount: ROLLING_DAYS[unit], unit: 'day' });
      }
      continue;
    }

    if (KEYWORDS.since.includes(word)) {
      const month = monthOf(next);
      if (month >= 0) {
        i++;
        let year = inferYear(month);
        const yearWord = words[i + 1];
        if (isPastYear(yearWord)) {
          year = Number(yearWord);
          i++;
        }
        setTime({ kind: 'since', from: toDayKey(year, month, 1) });
        continue;
      }
      if (isPastYear(next)) {
        i++;
        setTime({ kind: 'since', from: toDayKey(Number(next), 0, 1) });
      }
      continue;
    }

    const month = monthOf(word);
    if (month >= 0) {
      months.push(month);
      continue;
    }
    const sport = sportOf(word);
    if (sport !== null && fixed.sport === null) {
      fixed.sport = sport;
    }
  }

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const lastYear = years[years.length - 1];
  if (firstMonth !== undefined && lastMonth !== undefined) {
    let year = inferYear(lastMonth);
    if (lastYear !== undefined) {
      year = Number(lastYear.word);
    }
    let time = monthRange(year, lastMonth);
    if (months.length >= 2) {
      time = monthsRange(year, firstMonth, lastMonth);
    }
    setTime(time);
  } else if (lastYear !== undefined) {
    const firstYear = years[0] ?? lastYear;
    setTime(yearRange(Number(firstYear.word)));
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
  return { combos, names };
};

export const interpretFilterText = (text: string, now: number): FilterCriteria[] => {
  const parsed = parse(text, now);
  let name: string | null = null;
  if (parsed.names.length > 0) {
    name = parsed.names.join(' ');
  }

  const seen = new Set<string>();
  const interpretations: FilterCriteria[] = [];
  for (const combo of parsed.combos) {
    const criteria = { ...combo, name };
    const key = filterKey(criteria);
    if (isEmptyCriteria(criteria) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    interpretations.push(criteria);
  }
  return interpretations;
};
