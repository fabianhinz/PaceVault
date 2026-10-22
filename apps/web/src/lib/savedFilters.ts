import { v4 } from 'uuid';
import { m } from '@pacevault/i18n/messages.js';
import { getLocale } from '@pacevault/i18n/runtime.js';
import type { Sport, TrainingSession } from '@pacevault/engine/types.ts';
import { ATTRIBUTE_FILTER_KEYS, matchesFuzzy } from '@/lib/attributeFilters.ts';
import { normalizeText } from '@/lib/filterVocabulary.ts';
import {
  type FilterCalendarUnit,
  type FilterTime,
  type FilterTimeUnit,
  parseDayKey,
  resolveFilterRange,
} from '@/lib/timeRange.ts';

export interface FilterCriteria {
  sport: Sport | null;
  time: FilterTime | null;
  distance: number | null;
  duration: number | null;
  elevationGain: number | null;
  name: string | null;
}

export interface SavedFilter {
  id: string;
  criteria: FilterCriteria;
}

export type FilterPartKind = 'sport' | 'time' | 'distance' | 'duration' | 'elevationGain' | 'name';

type FilterSession = Pick<
  TrainingSession,
  'sport' | 'date' | 'duration' | 'distance' | 'elevationGain' | 'name'
>;

export const emptyCriteria = (): FilterCriteria => ({
  sport: null,
  time: null,
  distance: null,
  duration: null,
  elevationGain: null,
  name: null,
});

export const isEmptyCriteria = (criteria: FilterCriteria): boolean =>
  criteria.sport === null &&
  criteria.time === null &&
  criteria.name === null &&
  ATTRIBUTE_FILTER_KEYS.every((key) => criteria[key] === null);

export const createDefaultSavedFilters = (): SavedFilter[] => [
  {
    id: v4(),
    criteria: { ...emptyCriteria(), time: { kind: 'relative', amount: 7, unit: 'day' } },
  },
  {
    id: v4(),
    criteria: { ...emptyCriteria(), time: { kind: 'relative', amount: 30, unit: 'day' } },
  },
  { id: v4(), criteria: { ...emptyCriteria(), time: { kind: 'calendarYear', yearsAgo: 0 } } },
];

const timeKey = (time: FilterTime | null): string => {
  if (time === null) {
    return '';
  }
  if (time.kind === 'relative') {
    return `relative:${time.amount}:${time.unit}`;
  }
  if (time.kind === 'calendarYear') {
    return `calendarYear:${time.yearsAgo}`;
  }
  if (time.kind === 'calendar') {
    return `calendar:${time.unit}:${time.ago}`;
  }
  if (time.kind === 'since') {
    return `since:${time.from}`;
  }
  return `range:${time.from}:${time.to}:${time.source}`;
};

export const filterKey = (criteria: FilterCriteria): string =>
  [
    criteria.sport ?? '',
    timeKey(criteria.time),
    criteria.distance ?? '',
    criteria.duration ?? '',
    criteria.elevationGain ?? '',
    criteria.name ?? '',
  ].join('|');

const matchesName = (sessionName: string | undefined, name: string | null): boolean => {
  if (name === null) {
    return true;
  }
  if (sessionName === undefined) {
    return false;
  }
  const haystack = normalizeText(sessionName);
  return normalizeText(name)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
};

export const matchesFilters = (
  session: FilterSession,
  criteria: FilterCriteria | null,
  now: number,
): boolean => {
  if (criteria === null) {
    return true;
  }
  if (criteria.sport !== null && session.sport !== criteria.sport) {
    return false;
  }
  const range = resolveFilterRange(criteria.time, now);
  if (range !== null && (session.date < range.from || session.date > range.to)) {
    return false;
  }
  if (!matchesName(session.name, criteria.name)) {
    return false;
  }
  return (
    matchesFuzzy(session.duration, 'duration', criteria.duration) &&
    matchesFuzzy(session.distance, 'distance', criteria.distance) &&
    matchesFuzzy(session.elevationGain, 'elevationGain', criteria.elevationGain)
  );
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1, useGrouping: false }).format(
    value,
  );

const capitalize = (text: string): string =>
  text.charAt(0).toLocaleUpperCase(getLocale()) + text.slice(1);

const sportLabels: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

const relativeLabel = (amount: number, unit: FilterTimeUnit): string => {
  const count = formatNumber(amount);
  if (unit === 'week') {
    if (amount === 1) {
      return m.ui_filter_last_week();
    }
    return m.ui_filter_last_weeks({ count });
  }
  if (unit === 'month') {
    if (amount === 1) {
      return m.ui_filter_last_month();
    }
    return m.ui_filter_last_months({ count });
  }
  if (unit === 'year') {
    if (amount === 1) {
      return m.ui_filter_last_year();
    }
    return m.ui_filter_last_years({ count });
  }
  if (amount === 365) {
    return m.ui_filter_last_year();
  }
  if (amount === 1) {
    return m.ui_filter_last_day();
  }
  return m.ui_filter_last_days({ count });
};

const calendarLabel = (unit: FilterCalendarUnit, ago: number): string => {
  if (unit === 'day' && ago === 0) {
    return m.ui_filter_today();
  }
  if (unit === 'day' && ago === 1) {
    return m.ui_filter_yesterday();
  }
  if (unit === 'week' && ago === 0) {
    return m.ui_filter_this_week();
  }
  if (unit === 'month' && ago === 0) {
    return m.ui_filter_this_month();
  }
  const range = resolveFilterRange({ kind: 'calendar', unit, ago }, Date.now());
  if (range === null) {
    return '';
  }
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).formatRange(
    range.from,
    range.to,
  );
};

const timeLabel = (time: FilterTime): string => {
  if (time.kind === 'relative') {
    return relativeLabel(time.amount, time.unit);
  }
  if (time.kind === 'calendarYear') {
    if (time.yearsAgo === 0) {
      return m.ui_filter_this_year();
    }
    return String(new Date().getFullYear() - time.yearsAgo);
  }
  if (time.kind === 'calendar') {
    return calendarLabel(time.unit, time.ago);
  }
  if (time.kind === 'since') {
    const since = parseDayKey(time.from);
    if (since.getMonth() === 0 && since.getDate() === 1) {
      return m.ui_filter_since({ date: String(since.getFullYear()) });
    }
    return m.ui_filter_since({
      date: new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(since),
    });
  }
  const from = parseDayKey(time.from);
  const to = parseDayKey(time.to);
  if (time.source === 'year') {
    return String(from.getFullYear());
  }
  if (time.source === 'month') {
    return new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(from);
  }
  if (time.source === 'months') {
    return new Intl.DateTimeFormat(getLocale(), { month: 'short', year: 'numeric' }).formatRange(
      from,
      to,
    );
  }
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).formatRange(
    from,
    to,
  );
};

const durationLabel = (seconds: number): string => {
  if (seconds >= 3600 && seconds % 360 === 0) {
    return `${formatNumber(seconds / 3600)} h`;
  }
  return `${formatNumber(Math.round(seconds / 60))} min`;
};

interface FilterPart {
  kind: FilterPartKind;
  label: string;
}

export const filterParts = (criteria: FilterCriteria): FilterPart[] => {
  const parts: FilterPart[] = [];
  if (criteria.sport !== null) {
    parts.push({ kind: 'sport', label: sportLabels[criteria.sport]() });
  }
  if (criteria.time !== null) {
    parts.push({ kind: 'time', label: timeLabel(criteria.time) });
  }
  if (criteria.distance !== null) {
    parts.push({
      kind: 'distance',
      label: m.ui_filter_approx({ value: `${formatNumber(criteria.distance / 1000)} km` }),
    });
  }
  if (criteria.duration !== null) {
    parts.push({
      kind: 'duration',
      label: m.ui_filter_approx({ value: durationLabel(criteria.duration) }),
    });
  }
  if (criteria.elevationGain !== null) {
    parts.push({
      kind: 'elevationGain',
      label: m.ui_filter_approx({
        value: m.ui_filter_elevation({ value: formatNumber(criteria.elevationGain) }),
      }),
    });
  }
  if (criteria.name !== null) {
    parts.push({ kind: 'name', label: m.ui_filter_name({ value: criteria.name }) });
  }
  return parts;
};

export const filterName = (criteria: FilterCriteria): string =>
  filterParts(criteria)
    .map((part) => part.label)
    .join(' · ');

export const filterTile = (
  criteria: FilterCriteria,
): { kind: FilterPartKind; title: string; description: string } => {
  const parts = filterParts(criteria);
  const head = parts[0];
  if (head === undefined) {
    return { kind: 'time', title: '', description: '' };
  }
  const rest = parts.slice(1).map((part) => part.label);
  if (head.kind !== 'sport') {
    rest.push(m.ui_filter_all_sports());
  } else if (rest.length === 0) {
    rest.push(m.ui_filter_all_time());
  }
  return { kind: head.kind, title: capitalize(head.label), description: rest.join(' · ') };
};

const dayMonthRange = (from: Date, to: Date): string => {
  const parts = new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
  }).formatRangeToParts(from, to);
  return parts
    .filter((part, i) => part.type !== 'year' && parts[i + 1]?.type !== 'year')
    .map((part) => part.value)
    .join('');
};

export const zoomTile = (
  criteria: FilterCriteria | null,
): { title: string; description: string } | null => {
  if (criteria === null || criteria.time === null || criteria.time.kind !== 'range') {
    return null;
  }
  if (criteria.time.source !== 'zoom') {
    return null;
  }
  const from = parseDayKey(criteria.time.from);
  const to = parseDayKey(criteria.time.to);
  const rest = filterParts(criteria)
    .filter((part) => part.kind !== 'time')
    .map((part) => part.label);
  return {
    title: dayMonthRange(from, to),
    description: [
      new Intl.DateTimeFormat(getLocale(), { year: 'numeric' }).formatRange(from, to),
      ...rest,
    ].join(' · '),
  };
};
