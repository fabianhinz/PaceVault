import { getLocale } from '@/paraglide/runtime.js';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { toDateString } from './formatters.ts';
import { parseDayKey, toDayKey } from './timeRange.ts';

export const VOLUME_METRICS = ['distance', 'duration', 'elevation'] as const;

export type VolumeMetric = (typeof VOLUME_METRICS)[number];

type VolumeSession = Pick<TrainingSession, 'date' | 'distance' | 'duration' | 'elevationGain'>;

export interface VolumeTotal {
  value: number | undefined;
  recorded: number;
  sessions: number;
}

const MISSING = '--';

const VOLUME_UNITS: Record<VolumeMetric, string> = {
  distance: 'km',
  duration: 'h',
  elevation: 'm',
};

const metricValue = (session: VolumeSession, metric: VolumeMetric): number | undefined => {
  if (metric === 'distance') {
    return session.distance;
  }
  if (metric === 'elevation') {
    return session.elevationGain;
  }
  return session.duration;
};

export const shiftDayKey = (key: string, days: number): string => {
  const date = parseDayKey(key);
  return toDayKey(date.getFullYear(), date.getMonth(), date.getDate() + days);
};

export const previousVolumeWindow = (
  from: string,
  count: number,
): { from: string; to: string } => ({
  from: shiftDayKey(from, -count),
  to: shiftDayKey(from, -1),
});

export const cumulativeVolume = (
  sessions: readonly VolumeSession[],
  metric: VolumeMetric,
  from: string,
  through: readonly string[],
): VolumeTotal[] => {
  const entries = sessions
    .map((session) => ({ day: toDateString(session.date), value: metricValue(session, metric) }))
    .filter((entry) => entry.day >= from)
    .sort((a, b) => a.day.localeCompare(b.day));

  let next = 0;
  let sum = 0;
  let recorded = 0;
  return through.map((day): VolumeTotal => {
    while (next < entries.length && (entries[next]?.day ?? '') <= day) {
      const value = entries[next]?.value;
      if (value !== undefined) {
        sum += value;
        recorded += 1;
      }
      next += 1;
    }
    if (next > 0 && recorded === 0) {
      return { value: undefined, recorded, sessions: next };
    }
    return { value: sum, recorded, sessions: next };
  });
};

export const toVolumeDisplay = (metric: VolumeMetric, value: number): number => {
  if (metric === 'distance') {
    return value / 1000;
  }
  if (metric === 'duration') {
    return value / 3600;
  }
  return value;
};

export const volumeUnit = (metric: VolumeMetric): string => VOLUME_UNITS[metric];

export const formatVolume = (metric: VolumeMetric, value: number | undefined): string => {
  if (value === undefined) {
    return MISSING;
  }
  const display = toVolumeDisplay(metric, value);
  let fractionDigits = 0;
  if (metric === 'duration' || (metric === 'distance' && display < 100)) {
    fractionDigits = 1;
  }
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(display);
};

export const formatVolumeTick = (value: number): string =>
  new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value);

export const isVolumeIncomplete = (total: VolumeTotal): boolean =>
  total.recorded > 0 && total.recorded < total.sessions;
