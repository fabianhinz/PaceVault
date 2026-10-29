import type { DatedValue } from '@pacevault/engine/types.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const PROFILE_HISTORY_MIN_DAYS = 30;
const PROFILE_HISTORY_RIGHT_PAD = 0.07;
export const SPARKLINE_PAD = 2;

interface ProfileHistoryContext {
  firstSessionDate: number | undefined;
  createdAt: number;
  today: number;
}

interface ProfileHistoryPoint {
  date: number;
  value: number;
}

interface ProfileHistorySeries {
  points: ProfileHistoryPoint[];
  min: number | undefined;
  max: number | undefined;
}

interface SparklineBox {
  width: number;
  height: number;
}

interface SparklinePath {
  line: string;
  lastDot: { x: number; y: number } | undefined;
  todayX: number;
}

const displayDate = ({
  date,
  context,
}: {
  date: number;
  context: ProfileHistoryContext;
}): number => {
  if (date !== 0) return date;
  return context.firstSessionDate ?? context.createdAt;
};

export const firstSessionDateOf = (sessions: { date: number }[]): number | undefined => {
  let first: number | undefined = undefined;
  for (const session of sessions) {
    if (first === undefined || session.date < first) first = session.date;
  }
  return first;
};

export const profileHistorySeries = ({
  history,
  context,
}: {
  history: DatedValue<number>[];
  context: ProfileHistoryContext;
}): ProfileHistorySeries => {
  const points = history
    .map((entry) => ({ date: displayDate({ date: entry.date, context }), value: entry.value }))
    .sort((a, b) => a.date - b.date);
  if (points.length === 0) return { points, min: undefined, max: undefined };
  const values = points.map((point) => point.value);
  return { points, min: Math.min(...values), max: Math.max(...values) };
};

export const profileHistoryDomain = ({
  histories,
  context,
}: {
  histories: DatedValue<number>[][];
  context: ProfileHistoryContext;
}): [number, number] => {
  let from = context.today;
  for (const history of histories) {
    for (const entry of history) from = Math.min(from, displayDate({ date: entry.date, context }));
  }
  const minFrom = context.today - PROFILE_HISTORY_MIN_DAYS * MS_PER_DAY;
  const start = Math.min(from, minFrom);
  return [start, context.today + (context.today - start) * PROFILE_HISTORY_RIGHT_PAD];
};

const valueRange = (values: number[]): { low: number; high: number } => {
  let low = Math.min(...values);
  let high = Math.max(...values);
  if (low === high) {
    const spread = Math.abs(low) * 0.05 || 1;
    low -= spread;
    high += spread;
  }
  return { low, high };
};

const sparklineLine = ({
  points,
  first,
  xOf,
  yOf,
  right,
}: {
  points: ProfileHistoryPoint[];
  first: ProfileHistoryPoint;
  xOf: (date: number) => number;
  yOf: (value: number) => number;
  right: number;
}): string => {
  let line = `M${xOf(first.date).toFixed(1)} ${yOf(first.value).toFixed(1)}`;
  for (const point of points.slice(1)) {
    line += ` H${xOf(point.date).toFixed(1)} V${yOf(point.value).toFixed(1)}`;
  }
  line += ` H${right.toFixed(1)}`;
  return line;
};

export const sparklinePath = ({
  points,
  domain,
  box,
  today,
}: {
  points: ProfileHistoryPoint[];
  domain: [number, number];
  box: SparklineBox;
  today: number;
}): SparklinePath => {
  const right = box.width - SPARKLINE_PAD;
  const xOf = (date: number) =>
    SPARKLINE_PAD + ((date - domain[0]) / (domain[1] - domain[0])) * (right - SPARKLINE_PAD);
  const todayX = xOf(today);
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return { line: '', lastDot: undefined, todayX };
  const range = valueRange(points.map((point) => point.value));
  const yOf = (value: number) =>
    box.height -
    SPARKLINE_PAD -
    ((value - range.low) / (range.high - range.low)) * (box.height - 2 * SPARKLINE_PAD);
  const line = sparklineLine({ points, first, xOf, yOf, right });
  return { line, lastDot: { x: xOf(last.date), y: yOf(last.value) }, todayX };
};

export const sparklineDateAt = ({
  x,
  domain,
  width,
  today,
}: {
  x: number;
  domain: [number, number];
  width: number;
  today: number;
}): number => {
  const right = width - SPARKLINE_PAD;
  const clamped = Math.max(SPARKLINE_PAD, Math.min(right, x));
  const date =
    domain[0] + ((clamped - SPARKLINE_PAD) / (right - SPARKLINE_PAD)) * (domain[1] - domain[0]);
  return Math.min(today, date);
};
