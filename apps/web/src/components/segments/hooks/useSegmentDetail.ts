import { useMemo } from 'react';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { useSegmentPasses } from '@/queries/segments/useSegmentPasses.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { matchedSegment } from '@/components/segments/segmentPasses.ts';
import { segmentInFilter } from '@/components/segments/segmentFilter.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';

interface SegmentDetailState {
  segment: Segment | undefined;
  matched: MatchedSegment | undefined;
  finding: boolean;
}

export const useSegmentDetail = (segmentId: string | undefined): SegmentDetailState => {
  const segment = useSegmentsStore((s) =>
    s.segments.find((candidate) => candidate.id === segmentId),
  );
  const segmentPasses = useSegmentPasses({ enabled: segment !== undefined });
  const entry = segmentPasses.data?.find((candidate) => candidate.segmentId === segmentId);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const from = useRouterParam('from') ?? null;

  const matched = useMemo(() => {
    if (segment === undefined || entry === undefined) return undefined;
    return segmentInFilter({
      segment: matchedSegment({ segment, entry }),
      sessionsById: new Map(sessions.map((session) => [session.id, session])),
      criteria: activeFilter,
      now: Date.now(),
      keptSessionId: from,
    });
  }, [segment, entry, sessions, activeFilter, from]);

  return { segment, matched, finding: segmentPasses.isFetching };
};
