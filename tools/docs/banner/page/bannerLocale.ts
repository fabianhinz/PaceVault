import { BANNER_TEXT_BY_LOCALE } from '../bannerContent.ts';
import { DEFAULT_BANNER_LOCALE, isBannerLocale, type BannerLocale } from '../locales.ts';

const bannerLocaleFromUrl = (): BannerLocale => {
  const localeParam = new URLSearchParams(window.location.search).get('locale');
  if (isBannerLocale(localeParam)) return localeParam;
  return DEFAULT_BANNER_LOCALE;
};

export const BANNER_LOCALE = bannerLocaleFromUrl();
export const BANNER_COPY = BANNER_TEXT_BY_LOCALE[BANNER_LOCALE];
export const shotUrl = (file: string) => `/banner/out/${BANNER_LOCALE}/${file}`;
