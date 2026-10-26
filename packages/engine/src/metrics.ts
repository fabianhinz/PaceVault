// Sources: [CogganAllen2010], [TP-PMC]
// See packages/engine/SOURCES.md for full citations.

import type { TrainingSession, DailyMetrics } from './types.ts';

const CTL_DAYS = 42;
const ATL_DAYS = 7;

/** alpha = 1 - e^(-1/days), matching TrainingPeaks / WKO / GoldenCheetah. */
const ewmaStep = ({
  previous,
  todayTss,
  days,
}: {
  previous: number;
  todayTss: number;
  days: number;
}): number => {
  let safeTss = 0;
  if (Number.isFinite(todayTss)) {
    safeTss = todayTss;
  }
  const alpha = 1 - Math.exp(-1 / days);
  const smoothed = previous + (safeTss - previous) * alpha;
  if (Number.isFinite(smoothed)) {
    return smoothed;
  }
  return previous;
};

const dayStart = (timestamp: number): Date => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
};

const lastDayStart = (endDate: number | undefined): Date => {
  if (endDate) return dayStart(endDate);
  return dayStart(Date.now());
};

const dayKeysFromSessions = ({
  sessions,
  endDate,
  formatDate,
}: {
  sessions: TrainingSession[];
  endDate: number | undefined;
  formatDate: (ts: number) => string;
}): string[] => {
  if (sessions.length === 0) return [];

  const sorted = [...sessions].sort((a, b) => a.date - b.date);
  const first = sorted[0];
  if (!first) return [];
  const start = dayStart(first.date);
  const end = lastDayStart(endDate);

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current.getTime()));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const aggregateDailyTss = ({
  sessions,
  formatDate,
}: {
  sessions: TrainingSession[];
  formatDate: (ts: number) => string;
}): Map<string, number> => {
  const dailyTss = new Map<string, number>();

  for (const session of sessions) {
    const dateStr = formatDate(session.date);
    dailyTss.set(dateStr, (dailyTss.get(dateStr) ?? 0) + session.tss);
  }

  return dailyTss;
};

export const localDayKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const dailyMetricsFromSessions = ({
  sessions,
  endDate,
  includeGhosts,
}: {
  sessions: TrainingSession[];
  endDate?: number;
  includeGhosts?: boolean;
}): DailyMetrics[] => {
  const historicalSessions = sessions.filter((session) => !session.isPlanned);
  let allSessions = historicalSessions;
  if (includeGhosts) {
    allSessions = sessions;
  }

  const dates = dayKeysFromSessions({ sessions: allSessions, endDate, formatDate: localDayKey });
  if (dates.length === 0) return [];

  const dailyTss = aggregateDailyTss({ sessions: allSessions, formatDate: localDayKey });

  const metrics: DailyMetrics[] = [];
  let ctl = 0;
  let atl = 0;

  for (const date of dates) {
    const tss = dailyTss.get(date) ?? 0;

    ctl = ewmaStep({ previous: ctl, todayTss: tss, days: CTL_DAYS });
    atl = ewmaStep({ previous: atl, todayTss: tss, days: ATL_DAYS });
    const tsb = ctl - atl;
    let acwr = 0;
    if (ctl > 0) {
      acwr = atl / ctl;
    }

    metrics.push({
      date,
      tss,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      acwr: Math.round(acwr * 100) / 100,
    });
  }

  return metrics;
};
