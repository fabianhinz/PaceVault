import { formatNumber, formatRaceTime, formatUnit } from '@/lib/formatters.ts';

const watts = (value: number): string => formatNumber(value);

const duration = (seconds: number): string => formatRaceTime(Math.round(seconds));

const percent = (share: number): string => formatNumber(share * 100);

const peakWindow = (seconds: number): string => {
  if (seconds < 60) return formatUnit(seconds, 'second');
  return formatUnit(seconds / 60, 'minute');
};

const integer = (value: number): string => formatNumber(value);

export const statFormat = {
  watts,
  duration,
  percent,
  peakWindow,
  integer,
};
