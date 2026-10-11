export type QuantityUnit = 'km' | 'mi' | 'h' | 'min' | 'hm';
export type Unit = QuantityUnit | 'd' | 'w' | 'm' | 'y';

export const KEYWORDS = {
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
  mi: ['mi', 'mile', 'miles', 'meile', 'meilen'],
  h: ['h', 'std', 'stunde', 'stunden', 'hour', 'hours', 'hr'],
  min: ['min', 'minute', 'minuten', 'minutes', 'mins'],
  hm: ['hm', 'höhenmeter', 'hoehenmeter', 'm', 'climb', 'elevation'],
  d: ['tag', 'tage', 'tagen', 'd', 't', 'day', 'days'],
  w: ['woche', 'wochen', 'w', 'week', 'weeks'],
  m: ['monat', 'monate', 'monaten', 'month', 'months', 'mo'],
  y: ['jahr', 'jahre', 'jahren', 'year', 'years', 'y'],
  relative: [
    'letzte',
    'letzten',
    'letzter',
    'letztes',
    'vergangene',
    'vergangenen',
    'vergangenes',
    'last',
    'past',
  ],
  year: ['jahr', 'year'],
  this: ['this', 'diese', 'diesen', 'dieses', 'diesem', 'dieser'],
  since: ['since', 'seit', 'ab', 'from'],
  today: ['today', 'heute'],
  yesterday: ['yesterday', 'gestern'],
  running: ['laufen', 'lauf', 'läufe', 'joggen', 'jogging', 'run', 'running', 'runs', 'jog'],
  cycling: [
    'rad',
    'radfahren',
    'radfahrt',
    'radtour',
    'radeln',
    'rennrad',
    'fahrrad',
    'ausfahrt',
    'bike',
    'biking',
    'biken',
    'cycle',
    'ride',
    'rides',
    'cycling',
  ],
} satisfies Record<string, string[]>;

export const STOPWORDS = ['in', 'im', 'the', 'and', 'und', 'mit', 'with', 'von', 'for'];

/** Units that only match their exact spelling, never as a prefix. */
export const EXACT_ONLY_UNITS: Unit[] = ['mi', 'y'];
export const EXACT_UNIT_ORDER: Unit[] = ['km', 'mi', 'h', 'min', 'hm', 'd', 'w', 'm', 'y'];
export const PREFIX_UNIT_ORDER: Unit[] = ['d', 'w', 'm', 'km', 'min', 'h', 'hm'];

export const MONTH_NAMES: string[][] = Array.from({ length: 12 }, (_, index) => {
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

/** Words a typo is compared against, in order of preference on a tie. */
export const SUGGESTION_WORDS: string[] = [
  'running',
  'laufen',
  'joggen',
  'jogging',
  'cycling',
  'radfahren',
  'fahrrad',
  'radeln',
  'ride',
  'bike',
  'today',
  'heute',
  'yesterday',
  'gestern',
  'since',
  'seit',
  'this',
  'diese',
  'diesen',
  'dieses',
  'last',
  'letzte',
  'letzten',
  'letztes',
  'week',
  'woche',
  'month',
  'monat',
  'year',
  'jahr',
  ...MONTH_NAMES.flatMap((names) => names.filter((name) => name.length >= 4)),
];

/** Every keyword the grammar knows, so an unconsumed one is never called a typo. */
export const KNOWN_WORDS = new Set<string>([
  ...Object.values(KEYWORDS).flat(),
  ...MONTH_NAMES.flat(),
]);

const MAX_EDITS = 2;

/** Damerau (optimal string alignment) distance, capped: anything above 2 returns 3. */
export const editDistance = (a: string, b: string): number => {
  if (Math.abs(a.length - b.length) > MAX_EDITS) {
    return MAX_EDITS + 1;
  }
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => {
      if (i === 0) {
        return j;
      }
      if (j === 0) {
        return i;
      }
      return 0;
    }),
  );
  const at = (i: number, j: number): number => rows[i]?.[j] ?? MAX_EDITS + 1;
  for (let i = 1; i <= a.length; i++) {
    const row = rows[i];
    if (row === undefined) {
      break;
    }
    let rowMin = Number.POSITIVE_INFINITY;
    for (let j = 1; j <= b.length; j++) {
      let cost = 1;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
      }
      let value = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, at(i - 2, j - 2) + 1);
      }
      row[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > MAX_EDITS) {
      return MAX_EDITS + 1;
    }
  }
  return Math.min(at(a.length, b.length), MAX_EDITS + 1);
};

export const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
