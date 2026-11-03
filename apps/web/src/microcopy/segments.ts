import { m } from '@pacevault/i18n/messages.js';
import type { SegmentType } from '@pacevault/engine/segments.ts';
import { formatOrdinal, formatPlural } from '@/lib/format/formatters.ts';

export const LABEL_BY_SEGMENT_TYPE: Record<SegmentType, (inputs: { number: string }) => string> = {
  climb: m.ui_segment_type_climb,
  flat: m.ui_segment_type_flat,
  descent: m.ui_segment_type_descent,
  route: m.ui_segment_type_route,
};

export const segmentLabel = (segment: { type: SegmentType; typeNumber: number }): string =>
  LABEL_BY_SEGMENT_TYPE[segment.type]({ number: String(segment.typeNumber) });

export const segmentCountLabel = (count: number): string =>
  formatPlural(count, {
    one: () => m.ui_count_segments_one(),
    other: () => m.ui_count_segments_other({ count: String(count) }),
  });

export const passCountLabel = (count: number): string =>
  formatPlural(count, {
    one: () => m.ui_count_passes_one(),
    other: () => m.ui_count_passes_other({ count: String(count) }),
  });

export const showMorePassesLabel = (count: number): string =>
  formatPlural(count, {
    one: () => m.ui_segment_show_more_passes_one(),
    other: () => m.ui_segment_show_more_passes_other({ count: String(count) }),
  });

export const passRankLabel = ({ rank, count }: { rank: number; count: number }): string => {
  if (rank === 1) return m.ui_segment_rank_first({ count: String(count) });
  return m.ui_segment_rank({ ordinal: formatOrdinal(rank), count: String(count) });
};

export const showMoreSegmentsLabel = (count: number): string =>
  formatPlural(count, {
    one: () => m.ui_segments_show_more_one(),
    other: () => m.ui_segments_show_more_other({ count: String(count) }),
  });
