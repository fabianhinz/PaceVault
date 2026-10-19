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

export const loadBucketDayRange = (
  key: string,
  groupBy: 'day' | 'week' | 'month',
): { from: string; to: string } => {
  if (groupBy === 'month') {
    const start = parseDayKey(`${key}-01`);
    return {
      from: `${key}-01`,
      to: toDayKey(start.getFullYear(), start.getMonth() + 1, 0),
    };
  }
  if (groupBy === 'week') {
    const start = parseDayKey(key);
    return { from: key, to: toDayKey(start.getFullYear(), start.getMonth(), start.getDate() + 6) };
  }
  return { from: key, to: key };
};

export const buildPlanCacheKey = (
  weekOf: string,
  sessionCount: number,
  thresholdPace: number,
): string => `${weekOf}:${sessionCount}:${thresholdPace}`;
