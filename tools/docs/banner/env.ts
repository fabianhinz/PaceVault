import { resolve } from 'node:path';
import { DEFAULT_BANNER_LOCALE, isBannerLocale, type BannerLocale } from './locales.ts';

/** `run.ts` hands the `--locale` flag to the Playwright config and the capture through this. */
export const BANNER_LOCALE_ENV = 'BANNER_LOCALE';

export const bannerLocale = (): BannerLocale => {
  const value = process.env[BANNER_LOCALE_ENV];
  if (value === undefined || value === '') return DEFAULT_BANNER_LOCALE;
  if (!isBannerLocale(value)) throw new Error(`Unknown banner locale "${value}"`);
  return value;
};

export const WEB_APP_PORT = 5175;
export const WEB_APP_ORIGIN = `http://localhost:${WEB_APP_PORT}`;

export const BANNER_PORT = 5177;
export const BANNER_ORIGIN = `http://localhost:${BANNER_PORT}`;

export const REPO_ROOT = resolve(import.meta.dirname, '../../..');
