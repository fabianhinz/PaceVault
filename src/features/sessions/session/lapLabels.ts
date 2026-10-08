import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import { MIN_SUMMARY_LAPS, summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapSet, LapSource } from '@/lib/lapSet.ts';
import type { Sport } from '@/packages/engine/types.ts';

const kmFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 });
const kmUnitFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'kilometer',
  maximumFractionDigits: 1,
});
const speedFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'kilometer-per-hour',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const bpmFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });

export const speedRangeLabel = (slowKmh: number, fastKmh: number): string => {
  if (speedFmt.format(slowKmh) === speedFmt.format(fastKmh)) return speedFmt.format(fastKmh);
  return speedFmt.formatRange(slowKmh, fastKmh);
};

export const splitKm = (metres: number): string => kmFmt.format(metres / 1000);

export const splitDistanceLabel = (metres: number): string => kmUnitFmt.format(metres / 1000);

export const lapCountLabel = (count: number, source: Exclude<LapSource, 'off'>): string => {
  if (source === 'splits') {
    if (count === 1) return m.ui_laps_splits_one();
    return m.ui_laps_splits_count({ count: String(count) });
  }
  if (count === 1) return m.ui_laps_pill_one();
  return m.ui_laps_pill_count({ count: String(count) });
};

export const lapPaceLabel = (secPerKm: number, sport: Sport): string => {
  if (sport === 'running') return m.ui_laps_pace({ pace: railPaceFromSecPerKm(secPerKm) });
  return speedFmt.format(3600 / secPerKm);
};

const lapPaceRangeLabel = (
  fastestSecPerKm: number,
  slowestSecPerKm: number,
  sport: Sport,
): string => {
  if (sport === 'running') {
    const from = railPaceFromSecPerKm(fastestSecPerKm);
    const to = railPaceFromSecPerKm(slowestSecPerKm);
    if (from === to) return m.ui_laps_pace({ pace: from });
    return m.ui_laps_pace_range({ from, to });
  }
  return speedRangeLabel(3600 / slowestSecPerKm, 3600 / fastestSecPerKm);
};

interface LapsRowLabels {
  disabled: boolean;
  primary: string;
  secondary: string;
}

export const lapsRowLabels = (
  source: LapSource,
  set: LapSet | null,
  sport: Sport,
): LapsRowLabels => {
  if (source === 'off') {
    return { disabled: true, primary: m.ui_laps_row_off(), secondary: m.ui_laps_row_off_hint() };
  }
  if (source === 'splits' && !set) {
    return {
      disabled: true,
      primary: m.ui_laps_row_no_distance(),
      secondary: m.ui_laps_row_no_distance_hint(),
    };
  }
  const count = set?.analysis.length ?? 0;
  const countLabel = lapCountLabel(count, source);
  if (!set || count < MIN_SUMMARY_LAPS) {
    let hint = m.ui_laps_row_shorter_hint();
    if (source === 'device') hint = m.ui_laps_row_device_hint();
    return { disabled: true, primary: countLabel, secondary: hint };
  }

  const summary = summarizeLaps(set);
  let primary = countLabel;
  if (summary.avgSecPerKm !== undefined) {
    primary = m.ui_laps_row_primary({
      count: countLabel,
      value: lapPaceLabel(summary.avgSecPerKm, sport),
    });
  }

  let range = '';
  const fastestPace = summary.fastest?.paceSecPerKm;
  const slowestPace = summary.slowest?.paceSecPerKm;
  if (fastestPace !== undefined && slowestPace !== undefined) {
    range = lapPaceRangeLabel(fastestPace, slowestPace, sport);
  }

  let secondary = range;
  if (summary.avgHrRecovery !== undefined) {
    const bpm = bpmFmt.format(summary.avgHrRecovery);
    if (range === '') {
      secondary = m.ui_laps_row_recovery({ bpm });
    } else {
      secondary = m.ui_laps_row_range_recovery({ range, bpm });
    }
  }
  return { disabled: false, primary, secondary };
};

export const lapName = (lapIndex: number, source: LapSource): string => {
  const number = String(lapIndex + 1);
  if (source === 'splits') return m.ui_split_label({ number });
  return m.ui_lap_label({ number });
};
