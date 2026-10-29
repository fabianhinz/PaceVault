import { formatNumber, formatPaceTick } from '@/lib/format/formatters.ts';

export const MISSING = '--';

export const railInt = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  return String(Math.round(value));
};

export const railFixed1 = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  return formatNumber(value, 'fixed-one-decimal');
};

export const railSigned1 = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  if (value > 0) return `+${formatNumber(value, 'fixed-one-decimal')}`;
  if (value < 0) return `−${formatNumber(Math.abs(value), 'fixed-one-decimal')}`;
  return formatNumber(value, 'fixed-one-decimal');
};

export const railGain = (meters: number | null | undefined): string => {
  if (meters === undefined || meters === null) return MISSING;
  return `+${Math.round(meters)}`;
};

export const railLoss = (meters: number | null | undefined): string => {
  if (meters === undefined || meters === null) return MISSING;
  return `−${Math.round(meters)}`;
};

export const railPace = (minPerKm: number | null | undefined): string => {
  if (minPerKm === undefined || minPerKm === null) return MISSING;
  return formatPaceTick(minPerKm);
};

export const railPaceFromSecPerKm = (secPerKm: number | null | undefined): string => {
  if (secPerKm === undefined || secPerKm === null) return MISSING;
  return formatPaceTick(secPerKm / 60);
};

export const railVam = (metresPerHour: number): string => formatNumber(metresPerHour);
