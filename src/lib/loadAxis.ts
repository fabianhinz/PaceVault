import { SPORTS, type Sport } from '@/packages/engine/types.ts';
import { getMondayOfWeek, getMonthKey } from './weekKey.ts';

export type LoadGroupBy = 'day' | 'week' | 'month';

type SportTss = Record<Sport, number>;

export interface LoadBucket extends SportTss {
  key: string;
  from: string;
  to: string;
}

export interface LoadDay extends SportTss {
  date: string;
  bucket: string;
}

export const loadBucketKey = (day: string, groupBy: LoadGroupBy): string => {
  if (groupBy === 'week') {
    return getMondayOfWeek(day);
  }
  if (groupBy === 'month') {
    return getMonthKey(day);
  }
  return day;
};

const roundTss = (value: number): number => Math.round(value * 10) / 10;

export const buildLoadAxis = (
  days: readonly { date: string }[],
  sportTss: ReadonlyMap<string, Partial<Record<string, number>>>,
  groupBy: LoadGroupBy,
): { rows: LoadDay[]; buckets: Map<string, LoadBucket> } => {
  const buckets = new Map<string, LoadBucket>();
  for (const day of days) {
    const key = loadBucketKey(day.date, groupBy);
    let bucket = buckets.get(key);
    if (bucket === undefined) {
      bucket = { key, from: day.date, to: day.date, running: 0, cycling: 0 };
      buckets.set(key, bucket);
    }
    bucket.to = day.date;
    const entry = sportTss.get(day.date);
    for (const sport of SPORTS) {
      bucket[sport] += entry?.[sport] ?? 0;
    }
  }
  for (const bucket of buckets.values()) {
    for (const sport of SPORTS) {
      bucket[sport] = roundTss(bucket[sport]);
    }
  }
  const rows = days.map((day): LoadDay => {
    const key = loadBucketKey(day.date, groupBy);
    const bucket = buckets.get(key);
    return {
      date: day.date,
      bucket: key,
      running: bucket?.running ?? 0,
      cycling: bucket?.cycling ?? 0,
    };
  });
  return { rows, buckets };
};
