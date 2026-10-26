import { useMemo } from 'react';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { useSessionsStore } from '@/store/sessions.ts';

const UNVIRTUALIZED_LIST_CAP = 30;

interface TripSessionPicker {
  visibleSessions: TrainingSession[];
  hiddenCount: number;
}

export const useTripSessionPicker = (showAll: boolean): TripSessionPicker => {
  const sessions = useSessionsStore((s) => s.sessions);

  const selectableSessions = useMemo(
    () => sessions.filter((s) => !s.isPlanned).sort((a, b) => b.date - a.date),
    [sessions],
  );

  let visibleSessions = selectableSessions;
  if (!showAll) visibleSessions = selectableSessions.slice(0, UNVIRTUALIZED_LIST_CAP);
  const hiddenCount = selectableSessions.length - visibleSessions.length;
  return { visibleSessions, hiddenCount };
};
