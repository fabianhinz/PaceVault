import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { segmentsInFilter } from '@/components/segments/segmentFilter.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { useSegments } from './useSegments.ts';

export const useFilteredSegments = (
  options: { enabled?: boolean } = {},
): MatchedSegment[] | undefined => {
  const segments = useSegments(options);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);

  return useMemo(() => {
    if (segments === undefined) return undefined;
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));
    return segmentsInFilter({ segments, sessionsById, criteria: activeFilter, now: Date.now() });
  }, [segments, sessions, activeFilter]);
};
