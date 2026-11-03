import type { Channel, SegmentType, Sport } from './data.ts';

export type Lang = 'en' | 'de';

const pick = (lang: Lang, en: string, de: string) => {
  if (lang === 'de') return de;
  return en;
};

const plural = ({ lang, count, one, other }: { lang: Lang; count: number; one: [string, string]; other: [string, string] }) => {
  let forms = other;
  if (count === 1) forms = one;
  return pick(lang, forms[0], forms[1]).replace('#', new Intl.NumberFormat(lang).format(count));
};

const TYPE_LABEL: Record<SegmentType, [string, string]> = {
  climb: ['Climb', 'Anstieg'],
  flat: ['Flat', 'Flach'],
  descent: ['Descent', 'Bergab'],
  route: ['Route', 'Route'],
};

const SPORT_LABEL: Record<Sport, [string, string]> = {
  running: ['Running', 'Laufen'],
  cycling: ['Cycling', 'Radfahren'],
};

const CHANNEL_TITLE: Record<Channel, [string, string]> = {
  hr: ['Heart Rate', 'Herzfrequenz'],
  power: ['Power', 'Leistung'],
  speed: ['Speed', 'Geschwindigkeit'],
  pace: ['Pace', 'Tempo'],
  gap: ['Grade Adjusted Pace', 'Steigungsbereinigtes Tempo'],
  elevation: ['Elevation', 'Höhenmeter'],
  grade: ['Grade', 'Steigung'],
  cadence: ['Cadence', 'Kadenz'],
};

export const copy = (lang: Lang) => ({
  segmentLabel: (type: SegmentType, typeNumber: number) => `${pick(lang, ...TYPE_LABEL[type])} ${typeNumber}`,
  sport: (sport: Sport) => pick(lang, ...SPORT_LABEL[sport]),
  channel: (channel: Channel) => pick(lang, ...CHANNEL_TITLE[channel]),
  passes: (count: number) => plural({ lang, count, one: ['# pass', '# Durchgang'], other: ['# passes', '# Durchgänge'] }),
  passTimes: pick(lang, 'Pass times', 'Zeiten'),
  best: pick(lang, 'Best', 'Bestzeit'),
  showMorePasses: (count: number) => pick(lang, `Show ${count} more passes`, `${count} weitere Durchgänge anzeigen`),
  showFewerPasses: pick(lang, 'Show fewer passes', 'Weniger Durchgänge anzeigen'),
  openSession: pick(lang, 'Open session', 'Einheit öffnen'),
  railAvg: pick(lang, 'avg', 'Ø'),
  railMax: pick(lang, 'max', 'max'),
  railBest: pick(lang, 'best', 'beste'),
  railLoss: pick(lang, 'down', 'ab'),
  dashboard: 'Dashboard',
  sessions: pick(lang, 'Sessions', 'Einheiten'),
  labs: 'Labs',
  settings: pick(lang, 'Settings', 'Einstellungen'),
  map: pick(lang, 'Map', 'Karte'),
});

export type Copy = ReturnType<typeof copy>;
