import { formatRaceTime } from '@/lib/formatters.ts';
import { getLocale } from '@/paraglide/runtime.js';

export const integerFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
const secondsFmt = new Intl.NumberFormat(getLocale(), { style: 'unit', unit: 'second' });
const minutesFmt = new Intl.NumberFormat(getLocale(), { style: 'unit', unit: 'minute' });

export const watts = (value: number): string => integerFmt.format(value);

export const duration = (seconds: number): string => formatRaceTime(Math.round(seconds));

export const percent = (share: number): string => integerFmt.format(share * 100);

export const peakWindow = (seconds: number): string => {
  if (seconds < 60) return secondsFmt.format(seconds);
  return minutesFmt.format(seconds / 60);
};
