import type { CSSProperties, ReactNode } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { valueAt } from '@pacevault/engine/datedValue.ts';
import { ADD_CAPTION_BY_THRESHOLD } from '@/microcopy/thresholds.ts';
import { formatDate } from '@/lib/format/formatters.ts';
import { profileHistorySeries } from '@/components/settings/profileHistory.ts';
import { isEditable } from '@/components/settings/thresholdIcons.ts';
import type { ThresholdTileKey } from '@/components/settings/types.ts';
import type {
  ThresholdHistories,
  ThresholdTileContext,
  TileScrub,
  TileSpec,
} from '@/components/settings/types.ts';

const MISSING = '--';

interface ThresholdTileReading {
  points: { date: number; value: number }[];
  value: string;
  unit: string | undefined;
  note: ReactNode;
  style: CSSProperties | undefined;
}

const addCaption = ({
  key,
  histories,
}: {
  key: ThresholdTileKey;
  histories: ThresholdHistories;
}): string => {
  if (isEditable(key)) return ADD_CAPTION_BY_THRESHOLD[key]();
  const noFtp = histories.ftp.length === 0;
  if (noFtp && histories.weight.length === 0) return m.ui_thresholds_add_ftp_weight();
  if (noFtp) return m.ui_thresholds_add_ftp();
  return m.ui_thresholds_add_weight();
};

const scrubDateOf = ({
  scrub,
  key,
}: {
  scrub: TileScrub | null;
  key: ThresholdTileKey;
}): number | undefined => {
  if (scrub?.key === key) return scrub.date;
  return undefined;
};

export const useThresholdTileReading = ({
  tile,
  histories,
  context,
  scrub,
  fresh,
}: {
  tile: TileSpec;
  histories: ThresholdHistories;
  context: ThresholdTileContext;
  scrub: TileScrub | null;
  fresh: boolean;
}): ThresholdTileReading => {
  const points = profileHistorySeries({ history: histories[tile.key], context }).points;
  let shownValue = valueAt({ history: points, date: context.today });
  let note: ReactNode = undefined;
  const scrubDate = scrubDateOf({ scrub, key: tile.key });
  if (points.length === 0) {
    note = addCaption({ key: tile.key, histories });
  } else if (scrubDate !== undefined) {
    shownValue = valueAt({ history: points, date: scrubDate });
    const entryDate = valueAt({
      history: points.map((point) => ({ date: point.date, value: point.date })),
      date: scrubDate,
    });
    if (entryDate !== undefined) note = formatDate(entryDate, 'short');
  } else {
    const latest = points.at(-1);
    if (latest !== undefined) note = formatDate(latest.date, 'short');
  }
  let value = MISSING;
  let unit: string | undefined = undefined;
  if (shownValue !== undefined) {
    value = tile.format(shownValue);
    unit = tile.unit;
  }
  let style: CSSProperties | undefined = undefined;
  if (fresh) {
    style = { boxShadow: `0 0 0 1px color-mix(in srgb, ${tile.color} 66.667%, transparent)` };
  }
  return { points, value, unit, note, style };
};
