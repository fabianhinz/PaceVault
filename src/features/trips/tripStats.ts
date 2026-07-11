import type { TrainingSession } from '@/packages/engine/types.ts';

export interface TripTotals {
  count: number;
  distance: number; // metres
  duration: number; // seconds
  elevationGain: number; // metres
  tss: number;
  startDate: number | null; // unix ms, earliest session
  endDate: number | null; // unix ms, latest session
}

/** Aggregate a trip's sessions into display totals + date range. */
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
    totals.distance += session.distance;
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
