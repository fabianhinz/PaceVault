import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { segmentsInFilter } from '@/components/segments/segmentFilter.ts';
import { useSegments, type SegmentsState } from './useSegments.ts';

export const useFilteredSegments = (options: { enabled?: boolean } = {}): SegmentsState => {
  const segmentsState = useSegments(options);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const segments = segmentsState.segments;
  const updating = segmentsState.updating;

  return useMemo(() => {
    if (segments === undefined) return { segments, updating };
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));
    return {
      segments: segmentsInFilter({
        segments,
        sessionsById,
        criteria: activeFilter,
        now: Date.now(),
      }),
      updating,
    };
  }, [segments, updating, sessions, activeFilter]);
};
