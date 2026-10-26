import { getLocale } from '@pacevault/i18n/runtime.js';
import { m } from '@pacevault/i18n/messages.js';
import { MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '@pacevault/engine/time.ts';
import type { PersonalBest } from '@pacevault/engine/types.ts';

export type DateFormatMode =
  | 'date'
  | 'date-time'
  | 'short'
  | 'numeric-day'
  | 'numeric-month'
  | 'month-year'
  | 'hour-minute';

const DATE_FORMATS: Record<DateFormatMode, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric' }),
  'date-time': new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  short: new Intl.DateTimeFormat(getLocale(), { dateStyle: 'short' }),
  'numeric-day': new Intl.DateTimeFormat(getLocale(), {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }),
  'numeric-month': new Intl.DateTimeFormat(getLocale(), { month: 'numeric', year: 'numeric' }),
  'month-year': new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }),
  'hour-minute': new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' }),
};

export const formatDate = (value: number | Date, mode: DateFormatMode = 'date'): string =>
  DATE_FORMATS[mode].format(value);

export type DateRangeFormatMode =
  | 'day-month'
  | 'day-month-year'
  | 'month-year-short'
  | 'year'
  | 'day-month-without-year';

const dayMonthFmt = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' });

const DATE_RANGE_FORMATS: Record<DateRangeFormatMode, Intl.DateTimeFormat> = {
  'day-month': dayMonthFmt,
  'day-month-year': new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  'month-year-short': new Intl.DateTimeFormat(getLocale(), { month: 'short', year: 'numeric' }),
  year: new Intl.DateTimeFormat(getLocale(), { year: 'numeric' }),
  'day-month-without-year': dayMonthFmt,
};

export const formatDateRange = (
  from: number | Date,
  to: number | Date,
  mode: DateRangeFormatMode = 'day-month',
): string => {
  if (mode === 'day-month-without-year') {
    const parts = DATE_RANGE_FORMATS[mode].formatRangeToParts(from, to);
    return parts
      .filter((part, i) => part.type !== 'year' && parts[i + 1]?.type !== 'year')
      .map((part) => part.value)
      .join('');
  }
  return DATE_RANGE_FORMATS[mode].formatRange(from, to);
};

export type NumberFormatMode =
  | 'integer'
  | 'one-decimal'
  | 'one-decimal-ungrouped'
  | 'fixed-one-decimal'
  | 'fixed-two-decimals'
  | 'signed-fixed-one-decimal'
  | 'percent';

const NUMBER_FORMATS: Record<NumberFormatMode, Intl.NumberFormat> = {
  integer: new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }),
  'one-decimal': new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }),
  'one-decimal-ungrouped': new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 1,
    useGrouping: false,
  }),
  'fixed-one-decimal': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  'fixed-two-decimals': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  'signed-fixed-one-decimal': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'negative',
  }),
  percent: new Intl.NumberFormat(getLocale(), { style: 'percent' }),
};

export const formatNumber = (value: number, mode: NumberFormatMode = 'integer'): string =>
  NUMBER_FORMATS[mode].format(value);

export type UnitFormatMode =
  | 'celsius'
  | 'kilometer-per-hour'
  | 'kilometer-per-hour-fixed-one-decimal'
  | 'kilometer'
  | 'second'
  | 'minute';

const UNIT_FORMATS: Record<UnitFormatMode, Intl.NumberFormat> = {
  celsius: new Intl.NumberFormat(getLocale(), {
    style: 'unit',
    unit: 'celsius',
    maximumFractionDigits: 0,
  }),
  'kilometer-per-hour': new Intl.NumberFormat(getLocale(), {
    style: 'unit',
    unit: 'kilometer-per-hour',
    maximumFractionDigits: 0,
  }),
  'kilometer-per-hour-fixed-one-decimal': new Intl.NumberFormat(getLocale(), {
    style: 'unit',
    unit: 'kilometer-per-hour',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  kilometer: new Intl.NumberFormat(getLocale(), {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 1,
  }),
  second: new Intl.NumberFormat(getLocale(), { style: 'unit', unit: 'second' }),
  minute: new Intl.NumberFormat(getLocale(), { style: 'unit', unit: 'minute' }),
};

export const formatUnit = (value: number, mode: UnitFormatMode): string =>
  UNIT_FORMATS[mode].format(value);

export const formatUnitRange = (from: number, to: number, mode: UnitFormatMode): string =>
  UNIT_FORMATS[mode].formatRange(from, to);

type MonthNameLocale = 'de-DE' | 'en-GB';
type MonthNameWidth = 'long' | 'short';

const MONTH_NAME_FORMATS: Record<MonthNameLocale, Record<MonthNameWidth, Intl.DateTimeFormat>> = {
  'de-DE': {
    long: new Intl.DateTimeFormat('de-DE', { month: 'long' }),
    short: new Intl.DateTimeFormat('de-DE', { month: 'short' }),
  },
  'en-GB': {
    long: new Intl.DateTimeFormat('en-GB', { month: 'long' }),
    short: new Intl.DateTimeFormat('en-GB', { month: 'short' }),
  },
};

export const formatMonthName = (
  date: Date,
  options: { locale: MonthNameLocale; width: MonthNameWidth },
): string => MONTH_NAME_FORMATS[options.locale][options.width].format(date);

const pluralRules = new Intl.PluralRules(getLocale());

export const formatPlural = (
  count: number,
  forms: { one: () => string; other: () => string },
): string => {
  if (pluralRules.select(count) === 'one') {
    return forms.one();
  }
  return forms.other();
};

const localDateFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const formatBytes = (bytes: number): string => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const toDateString = (timestamp: number): string => {
  const parts = localDateFmt.formatToParts(timestamp);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const mo = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${mo}-${d}`;
};

export const formatDuration = (seconds: number): string => {
  const ms = seconds * MS_PER_SECOND;
  const h = Math.floor(ms / MS_PER_HOUR);
  const mins = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  if (h > 0) return `${h}h ${mins}m`;
  if (mins > 0) return `${mins}m ${s}s`;
  return `${s}s`;
};

export const formatRaceTime = (seconds: number): string => {
  const ms = seconds * MS_PER_SECOND;
  const h = Math.floor(ms / MS_PER_HOUR);
  const mins = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const secs = Math.round((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  if (h > 0) return `${h}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeHMS = (seconds: number): string => {
  const ms = seconds * MS_PER_SECOND;
  const h = Math.floor(ms / MS_PER_HOUR);
  const mins = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.round((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  return `${h}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatDistance = (meters: number | undefined): string => {
  if (meters === undefined) return '--';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const toKm = (meters: number): string => (meters / 1000).toFixed(2);

const formatMinSec = (totalSeconds: number): string => {
  const ms = Math.round(totalSeconds) * MS_PER_SECOND;
  const min = Math.floor(ms / MS_PER_MINUTE);
  const sec = (ms % MS_PER_MINUTE) / MS_PER_SECOND;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const formatPace = (secPerKm: number): string => `${formatMinSec(secPerKm)} /km`;

export const formatPaceTick = (minPerKm: number): string =>
  formatMinSec((minPerKm * MS_PER_MINUTE) / MS_PER_SECOND);

export const formatPaceInput = (seconds: number): string => formatMinSec(seconds);

export const parsePaceInput = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match || !match[1] || !match[2]) return undefined;
  const min = Number(match[1]);
  const sec = Number(match[2]);
  if (sec >= 60) return undefined;
  const totalSec = (min * MS_PER_MINUTE + sec * MS_PER_SECOND) / MS_PER_SECOND;
  if (totalSec < 150 || totalSec > 540) return undefined;
  return totalSec;
};

export const parseTimeHMS = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match || !match[1] || !match[2] || !match[3]) return undefined;
  const h = Number(match[1]);
  const mins = Number(match[2]);
  const s = Number(match[3]);
  if (mins >= 60 || s >= 60) return undefined;
  const total = (h * MS_PER_HOUR + mins * MS_PER_MINUTE + s * MS_PER_SECOND) / MS_PER_SECOND;
  if (total > 0) {
    return total;
  }
  return undefined;
};

const POWER_WINDOW_LABELS: Record<number, string> = {
  5: '5 sec',
  60: '1 min',
  300: '5 min',
  1200: '20 min',
  3600: '60 min',
};

const RUNNING_DISTANCE_LABELS: Record<number, string> = {
  1000: '1 km',
  5000: '5 km',
  10000: '10 km',
  21097: m.ui_pb_half_marathon(),
  42195: m.ui_pb_marathon(),
};

export const pbLabel = (pb: PersonalBest): string => {
  switch (pb.category) {
    case 'peak-power':
      return POWER_WINDOW_LABELS[pb.window] ?? `${pb.window}s`;
    case 'fastest-distance':
      return RUNNING_DISTANCE_LABELS[pb.window] ?? `${pb.window} m`;
    case 'longest':
      return m.ui_pb_longest();
    case 'most-elevation':
      return m.ui_pb_elevation_gain();
  }
};

export const formatPBValue = (pb: PersonalBest): string => {
  switch (pb.category) {
    case 'peak-power':
      return `${pb.value}W`;
    case 'fastest-distance':
      return formatDuration(pb.value);
    case 'longest':
      return formatDistance(pb.value);
    case 'most-elevation':
      return `${formatDistance(pb.value)} \u2191`;
  }
};

const SUB_SPORT_LABELS: Record<string, string> = {
  road: m.ui_sub_sport_road(),
  trail: m.ui_sub_sport_trail(),
  mountain: m.ui_sub_sport_mountain(),
  virtual_activity: m.ui_sub_sport_virtual(),
  indoor_cycling: m.ui_sub_sport_indoor(),
  indoor_running: m.ui_sub_sport_indoor(),
  track: m.ui_sub_sport_track(),
  gravel_cycling: m.ui_sub_sport_gravel(),
  treadmill: m.ui_sub_sport_treadmill(),
};

export const formatSubSport = (subSport: string): string => {
  return (
    SUB_SPORT_LABELS[subSport] ??
    subSport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
};
