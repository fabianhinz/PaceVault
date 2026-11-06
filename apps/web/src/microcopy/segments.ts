import { m } from '@pacevault/i18n/messages.js';
import { formatList, formatNumber, formatPlural } from '@/lib/format/formatters.ts';

const METERS_PER_KM = 1000;

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

export const showMoreSegmentsLabel = (count: number): string =>
  formatPlural(count, {
    one: () => m.ui_segments_show_more_one(),
    other: () => m.ui_segments_show_more_other({ count: String(count) }),
  });

export const segmentRangeName = ({
  name,
  startMeters,
  endMeters,
}: {
  name: string;
  startMeters: number;
  endMeters: number;
}): string =>
  m.ui_segment_name_suggestion({
    name,
    from: formatNumber(startMeters / METERS_PER_KM, 'fixed-one-decimal-ungrouped'),
    to: formatNumber(endMeters / METERS_PER_KM, 'fixed-one-decimal-ungrouped'),
  });

export const sessionSegmentsDeleteNote = (names: string[]): string => {
  const quoted = formatList(names.map((name) => m.ui_segment_quoted_name({ name })));
  return formatPlural(names.length, {
    one: () => m.ui_session_delete_segments_one({ names: quoted }),
    other: () => m.ui_session_delete_segments_other({ count: String(names.length), names: quoted }),
  });
};

export const passTileLabel = ({
  date,
  time,
  best,
}: {
  date: string;
  time: string;
  best: boolean;
}): string => {
  if (best) return m.ui_segment_pass_tile_best({ date, time });
  return m.ui_segment_pass_tile({ date, time });
};
