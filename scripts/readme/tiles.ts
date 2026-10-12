export const BANNER_LOCALES = ['de', 'en'] as const;
export type BannerLocale = (typeof BANNER_LOCALES)[number];
export const DEFAULT_BANNER_LOCALE: BannerLocale = 'de';

export const isBannerLocale = (value: string | undefined | null): value is BannerLocale =>
  BANNER_LOCALES.some((locale) => locale === value);

type FlowKey = 'heatmap' | 'laps';
type TileKey = 'summary' | 'weatherDetails' | 'studio' | 'splits' | 'filter';

interface TileText {
  title: string;
  subtitle: string;
}

interface FlowText {
  title: string;
  steps: string[];
}

interface BannerText {
  tagline: string;
  typedFilter: string;
  flows: Record<FlowKey, FlowText>;
  tiles: Record<TileKey, TileText>;
}

const filterReadings = (locale: BannerLocale, text: string) => {
  if (locale === 'de') return `„${text}“ → 3 Lesarten`;
  return `“${text}” → 3 readings`;
};

const EN_FILTER = 'ride 50';
const DE_FILTER = 'rad 50';

export const BANNER_TEXT: Record<BannerLocale, BannerText> = {
  en: {
    tagline: 'Your training, analyzed locally. No account. Works offline.',
    typedFilter: EN_FILTER,
    flows: {
      heatmap: { title: 'Interactive heatmap', steps: ['Locate, then click', 'Pick, export GPX'] },
      laps: { title: 'Laps in color', steps: ['Color by HR', 'Tap a lap', 'Lap stats'] },
    },
    tiles: {
      summary: { title: 'Session at a glance', subtitle: 'Everything in one card' },
      weatherDetails: { title: 'Hourly weather', subtitle: 'Still there offline' },
      studio: { title: 'Studio', subtitle: 'Split, mark, export' },
      splits: { title: 'Splits', subtitle: 'Any distance, one slider' },
      filter: { title: 'Just type it', subtitle: filterReadings('en', EN_FILTER) },
    },
  },
  de: {
    tagline: 'Dein Training, lokal analysiert. Kein Konto. Läuft offline.',
    typedFilter: DE_FILTER,
    flows: {
      heatmap: { title: 'Interaktive Heatmap', steps: ['Orten, klicken', 'Wählen, exportieren'] },
      laps: {
        title: 'Runden in Farbe',
        steps: ['Nach HF färben', 'Runde antippen', 'Werte der Runde'],
      },
    },
    tiles: {
      summary: { title: 'Einheit auf einen Blick', subtitle: 'Alles in einer Karte' },
      weatherDetails: { title: 'Wetter pro Stunde', subtitle: 'Auch offline da' },
      studio: { title: 'Studio', subtitle: 'Aufteilen, exportieren' },
      splits: { title: 'Splits', subtitle: 'Jede Distanz, ein Regler' },
      filter: { title: 'Einfach eintippen', subtitle: filterReadings('de', DE_FILTER) },
    },
  },
};

export interface BannerFrame {
  file: string;
  below?: string;
}

export interface BannerFlow {
  key: FlowKey;
  frames: BannerFrame[];
}

export interface BannerTile {
  key: TileKey;
  file: string;
}

export const BANNER_FLOWS: BannerFlow[] = [
  {
    key: 'heatmap',
    frames: [
      { file: '1a-heatmap-locate.png' },
      { file: '1b-heatmap-pick.png', below: '1b-heatmap-export.png' },
    ],
  },
  {
    key: 'laps',
    frames: [
      { file: '2a-laps-hr.png' },
      { file: '2b-laps-tap.png' },
      { file: '2c-laps-stats.png' },
    ],
  },
];

export const BANNER_TILES: BannerTile[] = [
  { key: 'summary', file: 'summary.png' },
  { key: 'weatherDetails', file: 'weather-details.png' },
  { key: 'studio', file: 'studio.png' },
  { key: 'splits', file: 'splits.png' },
  { key: 'filter', file: 'filter.png' },
];
