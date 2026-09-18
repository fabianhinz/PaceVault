export type ImportRange = '30d' | '12m' | 'all';

export interface IntervalsWindow {
  oldest: string;
  newest: string;
}

export const INTERVALS_MIN_DATE = '1990-01-01';

const SYNC_OVERLAP_DAYS = 7;

export const toIntervalsLocalDate = (ms: number): string => {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const shiftLocalDays = (ms: number, days: number): number => {
  const d = new Date(ms);
  d.setDate(d.getDate() - days);
  return d.getTime();
};

const shiftLocalMonths = (ms: number, months: number): number => {
  const d = new Date(ms);
  d.setMonth(d.getMonth() - months);
  return d.getTime();
};

export const buildRangeWindow = (range: ImportRange, nowMs: number): IntervalsWindow => {
  const newest = toIntervalsLocalDate(nowMs);

  if (range === '30d') {
    return { oldest: toIntervalsLocalDate(shiftLocalDays(nowMs, 30)), newest };
  }
  if (range === '12m') {
    return { oldest: toIntervalsLocalDate(shiftLocalMonths(nowMs, 12)), newest };
  }
  return { oldest: INTERVALS_MIN_DATE, newest };
};

export const buildSyncWindow = (
  lastSyncedAtMs: number | null,
  nowMs: number,
  overlapDays: number = SYNC_OVERLAP_DAYS,
): IntervalsWindow => {
  const newest = toIntervalsLocalDate(nowMs);

  if (lastSyncedAtMs === null) {
    return { oldest: INTERVALS_MIN_DATE, newest };
  }

  const oldest = toIntervalsLocalDate(shiftLocalDays(lastSyncedAtMs, overlapDays));
  if (oldest < INTERVALS_MIN_DATE) {
    return { oldest: INTERVALS_MIN_DATE, newest };
  }
  return { oldest, newest };
};
