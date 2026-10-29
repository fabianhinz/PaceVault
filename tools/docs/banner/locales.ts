export const BANNER_LOCALES = ['de', 'en'] as const;
export type BannerLocale = (typeof BANNER_LOCALES)[number];
export const DEFAULT_BANNER_LOCALE: BannerLocale = 'de';

export const isBannerLocale = (value: string | undefined | null): value is BannerLocale =>
  BANNER_LOCALES.some((locale) => locale === value);
