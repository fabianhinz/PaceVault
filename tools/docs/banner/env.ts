import { DEFAULT_BANNER_LOCALE, isBannerLocale, type BannerLocale } from './tiles.ts';

/** `run.ts` hands the `--locale` flag to the Playwright config and the capture through this. */
export const README_LOCALE_ENV = 'README_LOCALE';

export const readmeLocale = (): BannerLocale => {
  const value = process.env[README_LOCALE_ENV];
  if (value === undefined || value === '') return DEFAULT_BANNER_LOCALE;
  if (!isBannerLocale(value)) throw new Error(`Unknown README banner locale "${value}"`);
  return value;
};

/** The web app's dev server (apps/web), captured for the tiles. */
export const README_PORT = 5175;
export const README_ORIGIN = `http://localhost:${README_PORT}`;

/** tools/docs' own dev server, which serves the banner page and the raw tiles in `banner/out/`. */
export const BANNER_PORT = 5177;
export const BANNER_ORIGIN = `http://localhost:${BANNER_PORT}`;
