import type { Lang } from './copy.ts';

export const MISSING = '--';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export const raceTime = (seconds: number) => {
  const total = Math.round(Math.abs(seconds));
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = String(total % SECONDS_PER_MINUTE).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${rest}`;
  return `${minutes}:${rest}`;
};

export const gapText = (seconds: number) => {
  if (Math.round(seconds) === 0) return '0:00';
  if (seconds > 0) return `+${raceTime(seconds)}`;
  return `−${raceTime(seconds)}`;
};

export const sessionDuration = (seconds: number | null) => {
  if (seconds === null) return MISSING;
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = Math.floor(seconds % SECONDS_PER_MINUTE);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
};

export const date = (lang: Lang, value: number) =>
  new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(value);

export const distance = (lang: Lang, meters: number | null) => {
  if (meters === null) return MISSING;
  if (meters >= 1000) {
    const km = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false }).format(meters / 1000);
    return `${km} km`;
  }
  return `${Math.round(meters)} m`;
};

export const signedMeters = (meters: number) => {
  const rounded = Math.round(meters);
  if (rounded > 0) return `+${rounded} m`;
  if (rounded < 0) return `−${Math.abs(rounded)} m`;
  return '0 m';
};

export const integer = (value: number | null) => {
  if (value === null) return MISSING;
  return String(Math.round(value));
};

export const oneDecimal = (lang: Lang, value: number | null) => {
  if (value === null) return MISSING;
  return new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
};

export const signedOneDecimal = (lang: Lang, value: number | null) => {
  if (value === null) return MISSING;
  const text = oneDecimal(lang, Math.abs(value));
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return text;
};

export const pace = (secondsPerKm: number | null) => {
  if (secondsPerKm === null) return MISSING;
  return raceTime(secondsPerKm);
};

export const chartTime = (seconds: number) => raceTime(seconds);

export const shortDate = ({ lang, value, currentYear }: { lang: Lang; value: number; currentYear: number }) => {
  let locale = 'de';
  if (lang === 'en') locale = 'en-GB';
  if (new Date(value).getFullYear() === currentYear) return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(value);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: '2-digit' }).format(value);
};
