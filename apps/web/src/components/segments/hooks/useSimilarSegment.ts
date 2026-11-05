import { useMemo } from 'react';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { similarSegment } from '@/components/segments/segmentCreation.ts';

export const useSimilarSegment = (segment: Segment | null): Segment | undefined => {
  const segments = useSegmentsStore((s) => s.segments);
  return useMemo(() => {
    if (segment === null) return undefined;
    return similarSegment({ segment, segments });
  }, [segment, segments]);
};
