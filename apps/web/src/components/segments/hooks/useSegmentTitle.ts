import { formatDate } from '@/lib/format/formatters.ts';
import type { Segment } from '@/store/segments.ts';
import { passCountLabel } from '@/microcopy/segments.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { segmentFacts } from '@/components/segments/segmentFacts.ts';

interface SegmentTitle {
  title: string;
  subtitle: string;
}

const isMatchedSegment = (segment: Segment | MatchedSegment): segment is MatchedSegment =>
  'passes' in segment;

export const useSegmentTitle = (segment: Segment | MatchedSegment): SegmentTitle => {
  const parts: string[] = [];
  if (isMatchedSegment(segment) && segment.lastPassDate !== null) {
    parts.push(formatDate(segment.lastPassDate));
  }
  parts.push(...segmentFacts(segment));
  if (isMatchedSegment(segment)) parts.push(passCountLabel(segment.passes.length));
  return { title: segment.name, subtitle: parts.join(' · ') };
};
