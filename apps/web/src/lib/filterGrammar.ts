import type { Sport } from '@pacevault/engine/types.ts';
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

const closingIndex = ({
  text,
  from,
  pair,
}: {
  text: string;
  from: number;
  pair: QuotePair;
}): number => {
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
    const end = closingIndex({ text, from: i + 1, pair });
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

const relativeTime = ({
  amount,
  unit,
  limits,
}: {
  amount: number;
  unit: FilterTimeUnit;
  limits: Record<FilterTimeUnit, number>;
}): FilterTime | null => {
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
  from: toDayKey({ year, monthIndex: 0, day: 1 }),
  to: toDayKey({ year, monthIndex: 11, day: 31 }),
  source: 'year',
});

const monthRange = ({ year, month }: { year: number; month: number }): FilterTime => ({
  kind: 'range',
  from: toDayKey({ year, monthIndex: month, day: 1 }),
  to: toDayKey({ year, monthIndex: month + 1, day: 0 }),
  source: 'month',
});

const monthsRange = ({
  year,
  first,
  last,
}: {
  year: number;
  first: number;
  last: number;
}): FilterTime => {
  let fromYear = year;
  if (last < first) {
    fromYear = year - 1;
  }
  return {
    kind: 'range',
    from: toDayKey({ year: fromYear, monthIndex: first, day: 1 }),
    to: toDayKey({ year, monthIndex: last + 1, day: 0 }),
    source: 'months',
  };
};

type QuantityKind = 'distance' | 'duration' | 'elevationGain';

interface Quantity {
  kind: QuantityKind;
  target: number;
}

const toQuantity = ({ unit, n }: { unit: QuantityUnit; n: number }): Quantity => {
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

const guessQuantity = ({ unit, n }: { unit: QuantityUnit; n: number }): Quantity | null => {
  if (!GUESS_LIMITS[unit](n)) {
    return null;
  }
  return toQuantity({ unit, n });
};

const explicitQuantity = ({
  unit,
  n,
  unitWord,
}: {
  unit: QuantityUnit;
  n: number;
  unitWord: string;
}): Quantity | null => {
  if (n <= 0) {
    return null;
  }
  if (unitWord === 'm' && n < 50) {
    return null;
  }
  const parsed = toQuantity({ unit, n });
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

const withAlternative = ({
  criteria,
  alternative,
}: {
  criteria: FilterCriteria;
  alternative: Alternative;
}): FilterCriteria => {
  const next = { ...criteria };
  if (alternative.kind === 'time') {
    next.time = alternative.time;
  } else {
    next[alternative.kind] = alternative.target;
  }
  return next;
};

const isFree = ({
  criteria,
  kind,
}: {
  criteria: FilterCriteria;
  kind: Alternative['kind'];
}): boolean => criteria[kind] === null;

const alternativesFor = ({
  ambiguous,
  criteria,
}: {
  ambiguous: Ambiguous;
  criteria: FilterCriteria;
}): Alternative[] => {
  const out: Alternative[] = [];
  const addTime = (time: FilterTime | null) => {
    if (time !== null && isFree({ criteria, kind: 'time' })) {
      out.push({ kind: 'time', time });
    }
  };
  const addQuantity = (unit: QuantityUnit) => {
    const parsed = guessQuantity({ unit, n: ambiguous.n });
    if (parsed !== null && isFree({ criteria, kind: parsed.kind })) {
      out.push(parsed);
    }
  };
  if (ambiguous.relative) {
    addTime(relativeTime({ amount: ambiguous.n, unit: 'day', limits: GUESS_RELATIVE_LIMITS }));
    addTime(relativeTime({ amount: ambiguous.n, unit: 'week', limits: GUESS_RELATIVE_LIMITS }));
    addTime(relativeTime({ amount: ambiguous.n, unit: 'month', limits: GUESS_RELATIVE_LIMITS }));
    return out;
  }
  addQuantity('km');
  addQuantity('h');
  addTime(relativeTime({ amount: ambiguous.n, unit: 'day', limits: GUESS_RELATIVE_LIMITS }));
  if (ambiguous.n > 24) {
    addQuantity('min');
  }
  addQuantity('hm');
  return out;
};

const compoundMinutes = ({
  words,
  index,
}: {
  words: string[];
  index: number;
}): { value: number; consumed: number } | null => {
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

interface ParseState {
  fixed: FilterCriteria;
  ambiguous: Ambiguous[];
  months: number[];
  years: Token[];
  names: string[];
  currentYear: number;
  currentMonth: number;
}

const createParseState = (now: number): ParseState => ({
  fixed: emptyCriteria(),
  ambiguous: [],
  months: [],
  years: [],
  names: [],
  currentYear: new Date(now).getFullYear(),
  currentMonth: new Date(now).getMonth(),
});

const setTime = ({ state, time }: { state: ParseState; time: FilterTime | null }): void => {
  if (time !== null && state.fixed.time === null) {
    state.fixed.time = time;
  }
};

const setQuantity = ({ state, parsed }: { state: ParseState; parsed: Quantity | null }): void => {
  if (parsed !== null && state.fixed[parsed.kind] === null) {
    state.fixed[parsed.kind] = parsed.target;
  }
};

const inferYear = ({ state, month }: { state: ParseState; month: number }): number => {
  if (month > state.currentMonth) {
    return state.currentYear - 1;
  }
  return state.currentYear;
};

const isPastYear = ({ state, word }: { state: ParseState; word: string | undefined }): boolean => {
  if (word === undefined || !/^\d{4}$/.test(word)) {
    return false;
  }
  const n = Number(word);
  return n >= 1990 && n <= state.currentYear;
};

interface ReaderInput {
  state: ParseState;
  words: string[];
  i: number;
}

const readClock = ({
  state,
  words,
  i,
  clock,
}: ReaderInput & { clock: RegExpExecArray }): number => {
  let index = i;
  if (unitOf(words[index + 1]) === 'h') {
    index++;
  }
  const seconds = Number(clock[1]) * 3600 + Number(clock[2]) * 60;
  let parsed: Quantity | null = null;
  if (seconds > 0) {
    parsed = { kind: 'duration', target: seconds };
  }
  setQuantity({ state, parsed });
  return index;
};

const readNumberWithUnit = ({
  state,
  words,
  i,
  n,
  unit,
  unitWord,
}: ReaderInput & { n: number; unit: Unit; unitWord: string }): number => {
  let index = i + 1;
  if (isRelativeUnit(unit)) {
    setTime({
      state,
      time: relativeTime({
        amount: n,
        unit: RELATIVE_UNITS[unit],
        limits: EXPLICIT_RELATIVE_LIMITS,
      }),
    });
    return index;
  }
  if (unit === 'h' && Number.isInteger(n) && n > 0) {
    const minutes = compoundMinutes({ words, index: index + 1 });
    if (minutes !== null) {
      index += minutes.consumed;
      setQuantity({ state, parsed: { kind: 'duration', target: n * 3600 + minutes.value * 60 } });
      return index;
    }
  }
  if (isQuantityUnit(unit)) {
    setQuantity({ state, parsed: explicitQuantity({ unit, n, unitWord }) });
  }
  return index;
};

const readNumber = ({ state, words, i, token }: ReaderInput & { token: Token }): number => {
  const n = toNumber(token.word);
  const unitWord = words[i + 1];
  const unit = unitOf(unitWord);
  if (unit !== null && unitWord !== undefined) {
    return readNumberWithUnit({ state, words, i, n, unit, unitWord });
  }
  if (isPastYear({ state, word: token.word })) {
    state.years.push(token);
    return i;
  }
  state.ambiguous.push({
    n,
    relative: KEYWORDS.relative.includes(words[i - 1] ?? ''),
  });
  return i;
};

const readThis = ({ state, words, i }: ReaderInput): number => {
  const next = words[i + 1];
  const unit = unitOf(next);
  if (isYearWord(next)) {
    setTime({ state, time: { kind: 'calendarYear', yearsAgo: 0 } });
    return i + 1;
  }
  if (unit === 'w' || unit === 'm') {
    let calendarUnit: 'week' | 'month' = 'month';
    if (unit === 'w') {
      calendarUnit = 'week';
    }
    setTime({ state, time: { kind: 'calendar', unit: calendarUnit, ago: 0 } });
    return i + 1;
  }
  return i;
};

const readRelative = ({ state, words, i }: ReaderInput): number => {
  const next = words[i + 1];
  const unit = unitOf(next);
  if (isYearWord(next)) {
    setTime({ state, time: { kind: 'relative', amount: 365, unit: 'day' } });
    return i + 1;
  }
  if (isRelativeUnit(unit)) {
    setTime({ state, time: { kind: 'relative', amount: ROLLING_DAYS[unit], unit: 'day' } });
    return i + 1;
  }
  return i;
};

const readSince = ({ state, words, i }: ReaderInput): number => {
  const next = words[i + 1];
  const month = monthOf(next);
  if (month >= 0) {
    let index = i + 1;
    let year = inferYear({ state, month });
    const yearWord = words[index + 1];
    if (isPastYear({ state, word: yearWord })) {
      year = Number(yearWord);
      index++;
    }
    setTime({
      state,
      time: { kind: 'since', from: toDayKey({ year, monthIndex: month, day: 1 }) },
    });
    return index;
  }
  if (isPastYear({ state, word: next })) {
    setTime({
      state,
      time: { kind: 'since', from: toDayKey({ year: Number(next), monthIndex: 0, day: 1 }) },
    });
    return i + 1;
  }
  return i;
};

const readWord = ({ state, word }: { state: ParseState; word: string }): void => {
  const month = monthOf(word);
  if (month >= 0) {
    state.months.push(month);
    return;
  }
  const sport = sportOf(word);
  if (sport !== null && state.fixed.sport === null) {
    state.fixed.sport = sport;
  }
};

const readToken = ({ state, words, i, token }: ReaderInput & { token: Token }): number => {
  const word = token.word;
  const clock = CLOCK_PATTERN.exec(word);
  if (clock !== null) return readClock({ state, words, i, clock });
  if (isNumberWord(word)) return readNumber({ state, words, i, token });
  if (KEYWORDS.today.includes(word)) {
    setTime({ state, time: { kind: 'calendar', unit: 'day', ago: 0 } });
    return i;
  }
  if (KEYWORDS.yesterday.includes(word)) {
    setTime({ state, time: { kind: 'calendar', unit: 'day', ago: 1 } });
    return i;
  }
  if (KEYWORDS.this.includes(word)) return readThis({ state, words, i });
  if (KEYWORDS.relative.includes(word)) return readRelative({ state, words, i });
  if (KEYWORDS.since.includes(word)) return readSince({ state, words, i });
  readWord({ state, word });
  return i;
};

const applyMonthRange = (state: ParseState): void => {
  const firstMonth = state.months[0];
  const lastMonth = state.months[state.months.length - 1];
  const lastYear = state.years[state.years.length - 1];
  if (firstMonth !== undefined && lastMonth !== undefined) {
    let year = inferYear({ state, month: lastMonth });
    if (lastYear !== undefined) {
      year = Number(lastYear.word);
    }
    let time = monthRange({ year, month: lastMonth });
    if (state.months.length >= 2) {
      time = monthsRange({ year, first: firstMonth, last: lastMonth });
    }
    setTime({ state, time });
  } else if (lastYear !== undefined) {
    const firstYear = state.years[0] ?? lastYear;
    setTime({ state, time: yearRange(Number(firstYear.word)) });
  }
};

const combineAmbiguous = (state: ParseState): FilterCriteria[] => {
  let combos: FilterCriteria[] = [state.fixed];
  for (const entry of state.ambiguous) {
    const next = combos.flatMap((criteria) =>
      alternativesFor({ ambiguous: entry, criteria }).map((alternative) =>
        withAlternative({ criteria, alternative }),
      ),
    );
    if (next.length > 0) {
      combos = next;
    }
  }
  return combos;
};

const parse = ({ text, now }: { text: string; now: number }): ParseResult => {
  const tokens = tokenize(text);
  const words = tokens.map((token) => {
    if (token.quoted) {
      return '';
    }
    return token.word;
  });
  const state = createParseState(now);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) {
      continue;
    }
    if (token.quoted) {
      state.names.push(token.word);
      continue;
    }
    if (KEYWORDS.approx.includes(token.word) || token.word === '-') {
      continue;
    }
    i = readToken({ state, words, i, token });
  }
  applyMonthRange(state);
  return { combos: combineAmbiguous(state), names: state.names };
};

export const interpretFilterText = ({
  text,
  now,
}: {
  text: string;
  now: number;
}): FilterCriteria[] => {
  const parsed = parse({ text, now });
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
