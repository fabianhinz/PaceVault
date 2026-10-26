import { formatMonthName } from '@/lib/formatters.ts';

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
  km: ['km', 'k', 'kilometer'],
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

export const EXACT_ONLY_UNITS: Unit[] = ['mi', 'y'];
export const EXACT_UNIT_ORDER: Unit[] = ['km', 'mi', 'h', 'min', 'hm', 'd', 'w', 'm', 'y'];
export const PREFIX_UNIT_ORDER: Unit[] = ['d', 'w', 'm', 'km', 'min', 'h', 'hm'];

export const MONTH_NAMES: string[][] = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(2026, index, 15);
  const names = (['de-DE', 'en-GB'] as const).flatMap((locale) =>
    (['long', 'short'] as const).map((month) =>
      formatMonthName(date, { locale, width: month }).toLowerCase().replace('.', ''),
    ),
  );
  if (index === 2) {
    names.push('maerz');
  }
  return [...new Set(names)];
});

export const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
