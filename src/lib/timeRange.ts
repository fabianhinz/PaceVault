export type FilterTimeUnit = 'day' | 'week' | 'month';

type FilterRangeSource = 'year' | 'month' | 'months' | 'zoom';

export type FilterTime =
  | { kind: 'relative'; amount: number; unit: FilterTimeUnit }
  | { kind: 'calendarYear'; yearsAgo: number }
  | { kind: 'range'; from: string; to: string; source: FilterRangeSource };

interface ResolvedRange {
  from: number;
  to: number;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export const toDayKey = (year: number, monthIndex: number, day: number): string => {
  const d = new Date(year, monthIndex, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const parseDayKey = (key: string): Date => {
  const parts = key.split('-').map(Number);
  return new Date(parts[0] ?? NaN, (parts[1] ?? NaN) - 1, parts[2] ?? NaN);
};

const endOfDay = (date: Date): number => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};

const relativeStart = (amount: number, unit: FilterTimeUnit, now: number): number => {
  const today = new Date(now);
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  if (unit === 'month') {
    return new Date(year, month - amount, day + 1).getTime();
  }
  let days = amount;
  if (unit === 'week') {
    days = amount * 7;
  }
  return new Date(year, month, day - days + 1).getTime();
};

const unclampedRange = (time: FilterTime, now: number): ResolvedRange => {
  if (time.kind === 'relative') {
    return { from: relativeStart(time.amount, time.unit, now), to: endOfDay(new Date(now)) };
  }
  if (time.kind === 'calendarYear') {
    const year = new Date(now).getFullYear() - time.yearsAgo;
    return { from: new Date(year, 0, 1).getTime(), to: endOfDay(new Date(year, 11, 31)) };
  }
  return { from: parseDayKey(time.from).getTime(), to: endOfDay(parseDayKey(time.to)) };
};

export const resolveFilterRange = (time: FilterTime | null, now: number): ResolvedRange | null => {
  if (time === null) {
    return null;
  }
  const range = unclampedRange(time, now);
  return { from: range.from, to: Math.min(range.to, endOfDay(new Date(now))) };
};

export const isZoomTime = (time: FilterTime | null): boolean =>
  time !== null && time.kind === 'range' && time.source === 'zoom';
