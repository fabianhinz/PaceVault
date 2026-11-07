import type { TrainingSession } from '@pacevault/engine/types.ts';
import { matchesFilters, type FilterCriteria } from '@/lib/filtering/filters.ts';
import { byLastRidden, withPasses } from './segmentPasses.ts';
import type { MatchedSegment } from './types.ts';

export const segmentInFilter = ({
  segment,
  sessionsById,
  criteria,
  now,
  keptSessionId,
}: {
  segment: MatchedSegment;
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
  keptSessionId: string | null;
}): MatchedSegment => {
  if (criteria === null) return segment;
  const passes = segment.passes.filter((pass) => {
    if (pass.sessionId === keptSessionId) return true;
    const session = sessionsById.get(pass.sessionId);
    if (session === undefined) return false;
    return matchesFilters({ session, criteria, now });
  });
  return withPasses({ segment, passes });
};

export const segmentsInFilter = ({
  segments,
  sessionsById,
  criteria,
  now,
}: {
  segments: MatchedSegment[];
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
}): MatchedSegment[] => {
  if (criteria === null) return segments;
  return segments
    .flatMap((segment) => {
      const visible = segmentInFilter({
        segment,
        sessionsById,
        criteria,
        now,
        keptSessionId: null,
      });
      if (visible.passes.length === 0) return [];
      return [visible];
    })
    .sort(byLastRidden);
};
