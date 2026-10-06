import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapSet } from '@/lib/lapSet.ts';

const kmFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 });
const secondsFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });

export const splitKm = (metres: number): string => kmFmt.format(metres / 1000);

export const lapCountLabel = (count: number): string => {
  if (count === 1) return m.ui_laps_pill_one();
  return m.ui_laps_pill_count({ count: String(count) });
};

export const lapSummaryLabel = (set: LapSet): string => {
  const summary = summarizeLaps(set.analysis);
  const laps = lapCountLabel(summary.count);
  if (summary.spreadSecPerKm === undefined) return laps;
  return m.ui_laps_summary({ laps, spread: secondsFmt.format(summary.spreadSecPerKm) });
};

export const lapName = (lapIndex: number): string =>
  m.ui_lap_label({ number: String(lapIndex + 1) });
