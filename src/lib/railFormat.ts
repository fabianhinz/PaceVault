import { formatPaceTick } from '@/lib/formatters.ts';

const MISSING = '--';

export const railInt = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  return String(Math.round(value));
};

export const railFixed1 = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  return value.toFixed(1);
};

export const railSigned1 = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return MISSING;
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return `−${Math.abs(value).toFixed(1)}`;
  return value.toFixed(1);
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
