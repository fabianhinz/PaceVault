import type { TrainingSession } from '@pacevault/engine/types.ts';
import { matchesFilters, type FilterCriteria } from '@/lib/filtering/filters.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';

const visibleSegment = ({
  segment,
  sessionsById,
  criteria,
  now,
}: {
  segment: Segment;
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria;
  now: number;
}): Segment | undefined => {
  const passes = segment.passes.filter((pass) => {
    const session = sessionsById.get(pass.sessionId);
    if (session === undefined) return false;
    return matchesFilters({ session, criteria, now });
  });
  if (passes.length === 0) return undefined;
  return { ...segment, passes, lastPassDate: Math.max(...passes.map((pass) => pass.date)) };
};

export const segmentsInFilter = ({
  segments,
  sessionsById,
  criteria,
  now,
}: {
  segments: Segment[];
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
}): Segment[] => {
  if (criteria === null) return segments;
  return segments
    .flatMap((segment) => {
      const visible = visibleSegment({ segment, sessionsById, criteria, now });
      if (visible === undefined) return [];
      return [visible];
    })
    .sort((a, b) => b.lastPassDate - a.lastPassDate);
};

export const representedSessionIds = (segments: Segment[]): Set<string> =>
  new Set(segments.flatMap((segment) => segment.passes.map((pass) => pass.sessionId)));
