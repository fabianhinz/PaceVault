import { DEFAULT_BANNER_LOCALE, isBannerLocale, type BannerLocale } from './tiles.ts';

/** `run.ts` hands the `--locale` flag to the Playwright config and the capture through this. */
export const README_LOCALE_ENV = 'README_LOCALE';

export const readmeLocale = (): BannerLocale => {
  const value = process.env[README_LOCALE_ENV];
  if (value === undefined || value === '') return DEFAULT_BANNER_LOCALE;
  if (!isBannerLocale(value)) throw new Error(`Unknown README banner locale "${value}"`);
  return value;
};

export const README_PORT = 5175;
export const README_ORIGIN = `http://localhost:${README_PORT}`;
