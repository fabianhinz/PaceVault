/** The README banner tiles: what each capture writes and how the banner page shows it. */

export const BANNER_LOCALES = ['de', 'en'] as const;
export type BannerLocale = (typeof BANNER_LOCALES)[number];
export const DEFAULT_BANNER_LOCALE: BannerLocale = 'de';

export const isBannerLocale = (value: string | undefined | null): value is BannerLocale =>
  BANNER_LOCALES.some((locale) => locale === value);

type TileKey = 'heatmap' | 'zones' | 'filterGap' | 'form' | 'studio' | 'offline' | 'weather';

interface TileText {
  title: string;
  subtitle: string;
}

interface BannerText {
  /** Title strip line under "PaceVault". */
  tagline: string;
  /** Typed into the filter field on tile 6; its subtitle quotes it exactly. */
  typedFilter: string;
  tiles: Record<TileKey, TileText>;
}

const typeQuote = (locale: BannerLocale, text: string) => {
  if (locale === 'de') return `Tippe „${text}“`;
  return `Type “${text}”`;
};

const EN_FILTER = 'ride 50';
const DE_FILTER = 'rad 50';

/** Every banner text, one block per locale. */
export const BANNER_TEXT: Record<BannerLocale, BannerText> = {
  en: {
    tagline: 'Your training, analyzed locally. No account. Works offline.',
    typedFilter: EN_FILTER,
    tiles: {
      heatmap: { title: 'Interactive heatmap', subtitle: 'Locate, pick, export GPX' },
      zones: { title: 'Zones on the route', subtitle: 'Colored by HR, power or wind' },
      filterGap: { title: 'Filters, laps & GAP', subtitle: typeQuote('en', EN_FILTER) },
      form: { title: 'Fitness & form', subtitle: 'Load, fatigue and readiness' },
      studio: { title: 'Route studio', subtitle: 'Split a GPX, export segments' },
      offline: { title: 'Works offline', subtitle: 'Map and stats, no signal' },
      weather: { title: 'Weather & wind', subtitle: 'Wind vs. your direction' },
    },
  },
  de: {
    tagline: 'Dein Training, lokal analysiert. Kein Konto. Läuft offline.',
    typedFilter: DE_FILTER,
    tiles: {
      heatmap: { title: 'Interaktive Heatmap', subtitle: 'Orten, wählen, GPX-Export' },
      zones: { title: 'Zonen auf der Strecke', subtitle: 'Nach HF, Leistung oder Wind' },
      filterGap: { title: 'Filter, Runden & GAP', subtitle: typeQuote('de', DE_FILTER) },
      form: { title: 'Fitness & Form', subtitle: 'Last, Ermüdung, Bereitschaft' },
      studio: { title: 'Routen-Studio', subtitle: 'GPX teilen, Abschnitte sichern' },
      offline: { title: 'Läuft offline', subtitle: 'Karte und Werte ohne Netz' },
      weather: { title: 'Wetter & Wind', subtitle: 'Wind zu deiner Richtung' },
    },
  },
};

export interface BannerShot {
  /** File in `scripts/readme/out/<locale>/`. */
  file: string;
  /** CSS `object-position`; phone shots are anchored to the top. */
  objectPosition: string;
  /** Share of the tile height when a tile stacks several shots. */
  grow?: number;
}

export interface BannerTile {
  key: TileKey;
  /** Shots stacked top to bottom inside the tile. */
  shots: BannerShot[];
  place: 'hero' | 'grid' | 'phone';
  /** Status bar icons drawn above a phone shot. */
  statusBar?: 'online' | 'airplane';
}

/** Hero first, then the 2 × 2 grid row by row, then the phones. */
export const BANNER_TILES: BannerTile[] = [
  {
    key: 'heatmap',
    shots: [{ file: '1-heatmap.png', objectPosition: '50% 50%' }],
    place: 'hero',
  },
  { key: 'zones', shots: [{ file: '2-zones.png', objectPosition: '50% 50%' }], place: 'grid' },
  {
    key: 'filterGap',
    shots: [
      { file: '3-gap.png', objectPosition: '0% 50%', grow: 2 },
      { file: '3-filter.png', objectPosition: '0% 50%', grow: 3 },
    ],
    place: 'grid',
  },
  {
    key: 'form',
    shots: [
      { file: '4-form.png', objectPosition: '50% 50%', grow: 203 },
      { file: '4-performance.png', objectPosition: '50% 50%', grow: 320 },
    ],
    place: 'grid',
  },
  { key: 'studio', shots: [{ file: '5-studio.png', objectPosition: '50% 50%' }], place: 'grid' },
  {
    key: 'offline',
    shots: [{ file: '6-offline.png', objectPosition: '50% 0%' }],
    place: 'phone',
    statusBar: 'airplane',
  },
  {
    key: 'weather',
    shots: [{ file: '7-weather.png', objectPosition: '50% 0%' }],
    place: 'phone',
    statusBar: 'online',
  },
];
