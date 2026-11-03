import { MoveRight, Repeat, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import type { SegmentType } from '@pacevault/engine/segments.ts';

export const ICON_BY_SEGMENT_TYPE: Record<SegmentType, LucideIcon> = {
  climb: TrendingUp,
  flat: MoveRight,
  descent: TrendingDown,
  route: Repeat,
};
