const SECONDS_PER_MINUTE = 60;

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDate = (date: number): string => shortDate.format(date);

export const formatDate = (date: number): string => longDate.format(date);

export const formatRaceTime = (seconds: number): string => {
  const whole = Math.round(Math.abs(seconds));
  return `${Math.floor(whole / SECONDS_PER_MINUTE)}:${String(whole % SECONDS_PER_MINUTE).padStart(2, '0')}`;
};

export const formatGap = (seconds: number): string => `+${formatRaceTime(seconds)}`;

export const formatPace = (secondsPerKm: number): string => formatRaceTime(secondsPerKm);

const dayOfMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' });

export const formatDay = (date: number): string => dayOfMonth.format(date);

export const formatMonth = (date: number): string => monthShort.format(date);
