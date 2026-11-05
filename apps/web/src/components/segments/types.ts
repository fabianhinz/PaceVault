import type { Segment } from '@/store/segments.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';

export interface MatchedSegment extends Segment {
  geometry: Array<[number, number]>;
  passes: StoredSegmentPass[];
  lastPassDate: number | null;
}
