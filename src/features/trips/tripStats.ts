import type { TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';

interface TripTotals {
  count: number;
  distance: number | undefined;
  duration: number;
  elevationGain: number | undefined;
  tss: number;
  startDate: number | null;
  endDate: number | null;
}

const addRecorded = (total: number | undefined, value: number | undefined) => {
  if (value === undefined) return total;
  if (total === undefined) return value;
  return total + value;
};

export const computeTripTotals = (sessions: TrainingSession[]): TripTotals => {
  const totals: TripTotals = {
    count: sessions.length,
    distance: undefined,
    duration: 0,
    elevationGain: undefined,
    tss: 0,
    startDate: null,
    endDate: null,
  };

  for (const session of sessions) {
    totals.distance = addRecorded(totals.distance, session.distance);
    totals.duration += session.duration;
    totals.elevationGain = addRecorded(totals.elevationGain, session.elevationGain);
    totals.tss += session.tss;
    if (totals.startDate === null || session.date < totals.startDate) {
      totals.startDate = session.date;
    }
    if (totals.endDate === null || session.date > totals.endDate) {
      totals.endDate = session.date;
    }
  }

  return totals;
};

export const formatTripStatsLine = (totals: TripTotals): string => {
  let count = m.ui_count_sessions_other({ count: String(totals.count) });
  if (totals.count === 1) {
    count = m.ui_count_sessions_one();
  }
  const stats: string[] = [count];
  if (totals.count > 0) {
    stats.push(formatDistance(totals.distance));
    stats.push(formatDuration(totals.duration));
  }
  return stats.join(' · ');
};
