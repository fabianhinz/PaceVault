import { useMemo } from 'react';
import {
  sessionSegmentsInRideOrder,
  type SessionSegment,
} from '@/components/segments/segmentPasses.ts';
import { segmentInFilter } from '@/components/segments/segmentFilter.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useSegments } from './useSegments.ts';

export const useSessionSegments = (sessionId: string): SessionSegment[] | undefined => {
  const segments = useSegments();
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  return useMemo(() => {
    if (segments === undefined) return undefined;
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));
    const now = Date.now();
    const filtered = segments.map((segment) =>
      segmentInFilter({
        segment,
        sessionsById,
        criteria: activeFilter,
        now,
        keptSessionId: sessionId,
      }),
    );
    return sessionSegmentsInRideOrder({ segments: filtered, sessionId });
  }, [segments, sessions, activeFilter, sessionId]);
};
