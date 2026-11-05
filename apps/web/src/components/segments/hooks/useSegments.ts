import { useMemo } from 'react';
import { useSegmentsStore } from '@/store/segments.ts';
import { useSegmentPasses } from '@/queries/segments/useSegmentPasses.ts';
import { byLastRidden, matchedSegment } from '@/components/segments/segmentPasses.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';

export const useSegments = (options: { enabled?: boolean } = {}): MatchedSegment[] | undefined => {
  const segments = useSegmentsStore((s) => s.segments);
  const segmentPasses = useSegmentPasses({ enabled: options.enabled ?? true });
  const entries = segmentPasses.data;

  return useMemo(() => {
    if (entries === undefined) return undefined;
    const entryBySegmentId = new Map(entries.map((entry) => [entry.segmentId, entry]));
    return segments
      .flatMap((segment) => {
        const entry = entryBySegmentId.get(segment.id);
        if (entry === undefined) return [];
        return [matchedSegment({ segment, entry })];
      })
      .sort(byLastRidden);
  }, [segments, entries]);
};
