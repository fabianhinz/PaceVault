import type { TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';

interface TripTotals {
  count: number;
  distance: number;
  duration: number;
  elevationGain: number;
  tss: number;
  startDate: number | null;
  endDate: number | null;
}

export const computeTripTotals = (sessions: TrainingSession[]): TripTotals => {
  const totals: TripTotals = {
    count: sessions.length,
    distance: 0,
    duration: 0,
    elevationGain: 0,
    tss: 0,
    startDate: null,
    endDate: null,
  };

  for (const session of sessions) {
    totals.distance += session.distance ?? 0;
    totals.duration += session.duration;
    totals.elevationGain += session.elevationGain ?? 0;
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
