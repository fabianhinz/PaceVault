import type { DatedValue } from '@/packages/engine/datedValue.ts';

export const PROFILE_HISTORY_HOVER_GROUP = 'profile-history';

const DAY_MS = 86_400_000;
const PROFILE_HISTORY_MIN_DAYS = 30;

interface ProfileHistoryContext {
  firstSessionDate: number | undefined;
  createdAt: number;
  today: number;
}

interface ProfileHistoryPoint {
  date: number;
  value: number;
}

interface ProfileHistoryRow {
  date: number;
  value: number | null;
  carried: boolean;
}

interface ProfileHistorySeries {
  points: ProfileHistoryPoint[];
  min: number | undefined;
  max: number | undefined;
}

const displayDate = (date: number, context: ProfileHistoryContext): number => {
  if (date !== 0) return date;
  return context.firstSessionDate ?? context.createdAt;
};

export const profileHistorySeries = (
  history: DatedValue<number>[],
  context: ProfileHistoryContext,
): ProfileHistorySeries => {
  const points = history
    .map((entry) => ({ date: displayDate(entry.date, context), value: entry.value }))
    .sort((a, b) => a.date - b.date);
  if (points.length === 0) return { points, min: undefined, max: undefined };
  const values = points.map((point) => point.value);
  return { points, min: Math.min(...values), max: Math.max(...values) };
};

export const profileHistoryDomain = (
  histories: DatedValue<number>[][],
  context: ProfileHistoryContext,
): [number, number] => {
  let from = context.today;
  for (const history of histories) {
    for (const entry of history) from = Math.min(from, displayDate(entry.date, context));
  }
  const minFrom = context.today - PROFILE_HISTORY_MIN_DAYS * DAY_MS;
  return [Math.min(from, minFrom), context.today];
};

export const profileHistoryRows = (
  points: ProfileHistoryPoint[],
  domain: [number, number],
): ProfileHistoryRow[] => {
  const rows = new Map<number, ProfileHistoryRow>();
  for (let date = domain[0]; date <= domain[1]; date += DAY_MS) {
    rows.set(date, { date, value: null, carried: false });
  }
  for (const point of points) {
    rows.set(point.date, { date: point.date, value: point.value, carried: false });
  }
  const last = points.at(-1);
  if (last && last.date < domain[1]) {
    rows.set(domain[1], { date: domain[1], value: last.value, carried: true });
  }
  return [...rows.values()].sort((a, b) => a.date - b.date);
};
