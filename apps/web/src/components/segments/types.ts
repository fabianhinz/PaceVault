import { FLOATING_LG_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Segment } from '@/store/segments.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';

export interface MatchedSegment extends Segment {
  geometry: Array<[number, number]>;
  passes: StoredSegmentPass[];
  lastPassDate: number | null;
}

export const PASS_STRIP_SHELL_CLASS = cn(
  FLOATING_LG_CLASS,
  'lg:sticky lg:top-6 z-raised flex flex-col gap-3 rounded-3xl p-3',
);
