import type { BannerLocale } from './locales.ts';

export const FLOW_KEYS = ['heatmap', 'laps'] as const;
export type FlowKey = (typeof FLOW_KEYS)[number];
export const TILE_KEYS = ['summary', 'weatherDetails', 'studio', 'splits', 'filter'] as const;
export type TileKey = (typeof TILE_KEYS)[number];

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

export const FILTER_READING_COUNT = 4;

const EN_TYPED_FILTER = 'ride 50';
const DE_TYPED_FILTER = 'rad 50';

export const BANNER_TEXT_BY_LOCALE: Record<BannerLocale, BannerText> = {
  en: {
    tagline: 'Your training, analyzed locally. No account. Works offline.',
    typedFilter: EN_TYPED_FILTER,
    flows: {
      heatmap: { title: 'Interactive heatmap', steps: ['Locate, then click', 'Pick, export GPX'] },
      laps: { title: 'Laps in color', steps: ['Color by HR', 'Tap a lap', 'Lap stats'] },
    },
    tiles: {
      summary: { title: 'Session at a glance', subtitle: 'Everything in one card' },
      weatherDetails: { title: 'Hourly weather', subtitle: 'Still there offline' },
      studio: { title: 'Studio', subtitle: 'Split, mark, export' },
      splits: { title: 'Splits', subtitle: 'Any distance, one slider' },
      filter: {
        title: 'Just type it',
        subtitle: `“${EN_TYPED_FILTER}” → ${FILTER_READING_COUNT} readings`,
      },
    },
  },
  de: {
    tagline: 'Dein Training, lokal analysiert. Kein Konto. Läuft offline.',
    typedFilter: DE_TYPED_FILTER,
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
      filter: {
        title: 'Einfach eintippen',
        subtitle: `„${DE_TYPED_FILTER}“ → ${FILTER_READING_COUNT} Lesarten`,
      },
    },
  },
};

export interface BannerFrame {
  file: string;
  below?: string;
}

export const BACKDROP_FILE = '1b-heatmap-pick.png';

export const FRAMES_BY_FLOW: Record<FlowKey, BannerFrame[]> = {
  heatmap: [
    { file: '1a-heatmap-locate.png' },
    { file: BACKDROP_FILE, below: '1b-heatmap-export.png' },
  ],
  laps: [{ file: '2a-laps-hr.png' }, { file: '2b-laps-tap.png' }, { file: '2c-laps-stats.png' }],
};

export const SHOT_FILE_BY_TILE: Record<TileKey, string> = {
  summary: 'summary.png',
  weatherDetails: 'weather-details.png',
  studio: 'studio.png',
  splits: 'splits.png',
  filter: 'filter.png',
};
