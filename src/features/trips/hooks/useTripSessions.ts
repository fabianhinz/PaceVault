import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import type { Trip } from '@/store/trips.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

/** Resolve a trip's sessionIds into its sessions, newest first. */
export const useTripSessions = (trip: Trip): TrainingSession[] => {
  const sessions = useSessionsStore((s) => s.sessions);
  return useMemo(() => {
    const byId = new Map(sessions.map((s) => [s.id, s]));
    return trip.sessionIds
      .map((id) => byId.get(id))
      .filter((s): s is TrainingSession => Boolean(s))
      .sort((a, b) => b.date - a.date);
  }, [sessions, trip.sessionIds]);
};
