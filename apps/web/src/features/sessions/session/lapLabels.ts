import { m } from '@pacevault/i18n/messages.js';
import { getLocale } from '@pacevault/i18n/runtime.js';
import { railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import { MIN_SUMMARY_LAPS, summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapSet, LapSetEfforts, LapSource } from '@/lib/lapSet.ts';
import { effortPattern, effortWorkCount, effortWorkSet } from '@/lib/effortLaps.ts';
import type { EffortSignal } from '@pacevault/engine/effortDetection.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { duration, watts } from './statFormat.ts';

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

export const splitDistanceLabel = (metres: number): string => kmUnitFmt.format(metres / 1000);

export const lapCountLabel = (count: number, source: Exclude<LapSource, 'off'>): string => {
  if (source === 'splits') {
    if (count === 1) return m.ui_laps_splits_one();
    return m.ui_laps_splits_count({ count: String(count) });
  }
  if (source === 'efforts') {
    if (count === 1) return m.ui_laps_efforts_one();
    return m.ui_laps_efforts_count({ count: String(count) });
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
  if (source === 'efforts' && !set) {
    return {
      disabled: true,
      primary: m.ui_laps_efforts_none(),
      secondary: m.ui_laps_row_device_hint(),
    };
  }
  let summarySet = set;
  if (source === 'efforts' && set) summarySet = effortWorkSet(set);
  const count = summarySet?.analysis.length ?? 0;
  const countLabel = lapCountLabel(count, source);
  if (!summarySet || count < MIN_SUMMARY_LAPS) {
    let hint = m.ui_laps_row_shorter_hint();
    if (source === 'device') hint = m.ui_laps_row_device_hint();
    return { disabled: true, primary: countLabel, secondary: hint };
  }

  const summary = summarizeLaps(summarySet);
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

const effortValueLabel = (signal: EffortSignal, value: number): string => {
  if (signal === 'power') return m.ui_laps_efforts_watts({ watts: watts(value) });
  if (signal === 'pace') return m.ui_laps_pace({ pace: railPaceFromSecPerKm(value) });
  return m.ui_laps_efforts_bpm({ bpm: bpmFmt.format(value) });
};

export const effortChipLabel = (set: LapSet, efforts: LapSetEfforts): string => {
  const pattern = effortPattern(set);
  let summary = lapCountLabel(effortWorkCount(set), 'efforts');
  if (pattern) {
    summary = m.ui_laps_efforts_pattern({
      count: String(pattern.count),
      duration: duration(pattern.movingTime),
    });
  }
  if (efforts.workAverage === undefined) return summary;
  return m.ui_laps_efforts_chip({
    summary,
    value: effortValueLabel(efforts.signal, efforts.workAverage),
  });
};

const effortName = (set: LapSet, lapIndex: number, sport: Sport): string => {
  const lap = set.analysis.find((candidate) => candidate.lapIndex === lapIndex);
  const intensity = lap?.intensity ?? 'active';
  if (intensity === 'warmup') {
    if (sport === 'running') return m.ui_effort_warmup_run();
    return m.ui_effort_warmup_ride();
  }
  if (intensity === 'cooldown') {
    if (sport === 'running') return m.ui_effort_cooldown_run();
    return m.ui_effort_cooldown_ride();
  }
  const ordinal = set.analysis.filter(
    (candidate) => candidate.intensity === intensity && candidate.lapIndex <= lapIndex,
  ).length;
  const number = String(Math.max(1, ordinal));
  if (intensity === 'steady') return m.ui_effort_steady_label({ number });
  if (intensity === 'rest') return m.ui_effort_rest_label({ number });
  return m.ui_effort_work_label({ number });
};

export const lapName = (set: LapSet, lapIndex: number, source: LapSource, sport: Sport): string => {
  if (source === 'efforts') return effortName(set, lapIndex, sport);
  const number = String(lapIndex + 1);
  if (source === 'splits') return m.ui_split_label({ number });
  return m.ui_lap_label({ number });
};
