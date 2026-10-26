import { toDateString } from './formatters.ts';
import { parseDayKey, toDayKey } from './timeRange.ts';

export const getMondayOfWeek = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toDateString(d.getTime());
};

export const getMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
};

export const loadBucketDayRange = ({
  key,
  groupBy,
}: {
  key: string;
  groupBy: 'day' | 'week' | 'month';
}): { from: string; to: string } => {
  if (groupBy === 'month') {
    const start = parseDayKey(`${key}-01`);
    return {
      from: `${key}-01`,
      to: toDayKey({ year: start.getFullYear(), monthIndex: start.getMonth() + 1, day: 0 }),
    };
  }
  if (groupBy === 'week') {
    const start = parseDayKey(key);
    return {
      from: key,
      to: toDayKey({
        year: start.getFullYear(),
        monthIndex: start.getMonth(),
        day: start.getDate() + 6,
      }),
    };
  }
  return { from: key, to: key };
};

/** 32-bit FNV-1a over the stored loads, in store order: changes whenever a load changes. */
const loadDigest = (loads: number[]): string => {
  let hash = 0x811c9dc5;
  for (const char of loads.join(',')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

/**
 * The Labs week plan is kept per week, session count, threshold pace and stored loads: a
 * recompute or reprocess that moves the loads refreshes it, otherwise it stays for the week.
 */
export const buildPlanCacheKey = ({
  weekOf,
  loads,
  thresholdPace,
}: {
  weekOf: string;
  loads: number[];
  thresholdPace: number;
}): string => `${weekOf}:${loads.length}:${thresholdPace}:${loadDigest(loads)}`;
