import type { TrainingSession } from '@pacevault/engine/types.ts';
import { niceStep, yAxisWidthFor } from '@/lib/colors/chartTheme.ts';
import { formatDateRange, formatNumber, toDateString } from '@/lib/format/formatters.ts';
import { type FilterTime, parseDayKey, toDayKey } from './timeRange.ts';

export const VOLUME_METRICS = ['distance', 'duration', 'elevation'] as const;

export type VolumeMetric = (typeof VOLUME_METRICS)[number];

type VolumeSession = Pick<TrainingSession, 'date' | 'distance' | 'duration' | 'elevationGain'>;

export interface VolumeTotal {
  value: number | undefined;
  recorded: number;
  sessions: number;
}

const MISSING = '--';

const UNIT_BY_VOLUME_METRIC: Record<VolumeMetric, string> = {
  distance: 'km',
  duration: 'h',
  elevation: 'm',
};

const metricValue = ({
  session,
  metric,
}: {
  session: VolumeSession;
  metric: VolumeMetric;
}): number | undefined => {
  if (metric === 'distance') {
    return session.distance;
  }
  if (metric === 'elevation') {
    return session.elevationGain;
  }
  return session.duration;
};

interface BeforeVolumeWindow {
  from: string;
  through: string[];
}

interface VolumeRange {
  from: string;
  count: number;
}

interface VolumeTotals {
  current: VolumeTotal[];
  before: VolumeTotal[] | null;
  beforeWindow: BeforeVolumeWindow | null;
}

const shiftDayKey = (key: string, days: number): string => {
  const date = parseDayKey(key);
  return toDayKey({
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    day: date.getDate() + days,
  });
};

const sameDateLastYear = (key: string): string => {
  const date = parseDayKey(key);
  const year = date.getFullYear() - 1;
  const lastDayOfMonth = new Date(year, date.getMonth() + 1, 0).getDate();
  return toDayKey({
    year,
    monthIndex: date.getMonth(),
    day: Math.min(date.getDate(), lastDayOfMonth),
  });
};

const isCalendarTime = (time: FilterTime | null): boolean => {
  if (time === null) return false;
  if (time.kind === 'calendarYear' || time.kind === 'calendar' || time.kind === 'since') {
    return true;
  }
  return time.kind === 'range' && time.source !== 'zoom';
};

export const beforeVolumeWindow = ({
  time,
  from,
  count,
  through,
}: {
  time: FilterTime | null;
  from: string;
  count: number;
  through: readonly string[];
}): BeforeVolumeWindow => {
  if (isCalendarTime(time)) {
    return {
      from: sameDateLastYear(from),
      through: through.map(sameDateLastYear),
    };
  }
  return {
    from: shiftDayKey(from, -count),
    through: through.map((day) => shiftDayKey(day, -count)),
  };
};

export const cumulativeVolume = ({
  sessions,
  metric,
  from,
  through,
}: {
  sessions: readonly VolumeSession[];
  metric: VolumeMetric;
  from: string;
  through: readonly string[];
}): VolumeTotal[] => {
  const entries = sessions
    .map((session) => ({
      day: toDateString(session.date),
      value: metricValue({ session, metric }),
    }))
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
    if (recorded === 0) {
      return { value: undefined, recorded, sessions: next };
    }
    return { value: sum, recorded, sessions: next };
  });
};

export const volumeTotals = ({
  sessions,
  metric,
  time,
  range,
  through,
}: {
  sessions: readonly VolumeSession[];
  metric: VolumeMetric;
  time: FilterTime | null;
  range: VolumeRange | null;
  through: readonly string[];
}): VolumeTotals => {
  if (range === null) {
    return {
      current: cumulativeVolume({ sessions, metric, from: through[0] ?? '', through }),
      before: null,
      beforeWindow: null,
    };
  }
  const beforeWindow = beforeVolumeWindow({ time, from: range.from, count: range.count, through });
  return {
    current: cumulativeVolume({ sessions, metric, from: range.from, through }),
    before: cumulativeVolume({
      sessions,
      metric,
      from: beforeWindow.from,
      through: beforeWindow.through,
    }),
    beforeWindow,
  };
};

export const formatVolumeWindow = (window: BeforeVolumeWindow): string | null => {
  const last = window.through[window.through.length - 1];
  if (last === undefined) {
    return null;
  }
  return formatDateRange(parseDayKey(window.from), parseDayKey(last), 'day-month-year');
};

export const toVolumeDisplay = ({
  metric,
  value,
}: {
  metric: VolumeMetric;
  value: number;
}): number => {
  if (metric === 'distance') {
    return value / 1000;
  }
  if (metric === 'duration') {
    return value / 3600;
  }
  return value;
};

export const volumeUnit = (metric: VolumeMetric): string => UNIT_BY_VOLUME_METRIC[metric];

export const formatVolume = ({
  metric,
  value,
}: {
  metric: VolumeMetric;
  value: number | undefined;
}): string => {
  if (value === undefined) {
    return MISSING;
  }
  const display = toVolumeDisplay({ metric, value });
  if (metric === 'duration' || (metric === 'distance' && display < 100)) {
    return formatNumber(display, 'fixed-one-decimal');
  }
  return formatNumber(display);
};

export const formatVolumeTick = (value: number): string => formatNumber(value, 'one-decimal');

const VOLUME_TICK_COUNT = 3;

export const volumeAxisTicks = (values: readonly (number | null)[]): number[] | undefined => {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) {
    return undefined;
  }
  const max = Math.max(...present);
  if (max <= 0) {
    return undefined;
  }
  const step = niceStep(max / (VOLUME_TICK_COUNT - 1));
  return Array.from({ length: VOLUME_TICK_COUNT }, (_, i) => Number((i * step).toPrecision(12)));
};

export const DASHBOARD_Y_AXIS_WIDTH = yAxisWidthFor(['100.000']);
