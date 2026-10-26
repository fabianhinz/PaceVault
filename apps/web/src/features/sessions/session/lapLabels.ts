import { m } from '@pacevault/i18n/messages.js';
import { formatNumber, formatPlural, formatUnit, formatUnitRange } from '@/lib/formatters.ts';
import { railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import {
  MIN_SUMMARY_LAPS,
  summarizeLaps,
  type LapSet,
  type LapSetEfforts,
  type LapSource,
  effortPattern,
  effortWorkCount,
  effortWorkSet,
} from '@/lib/laps.ts';
import type { EffortLimiter, EffortSignal } from '@pacevault/engine/effortDetection.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { NUDGE_BY_EFFORT_LIMITER } from '@/microcopy/laps.ts';
import { statFormat } from './statFormat.ts';

const SPEED_MODE = 'kilometer-per-hour-fixed-one-decimal';

export const speedRangeLabel = ({
  slowKmh,
  fastKmh,
}: {
  slowKmh: number;
  fastKmh: number;
}): string => {
  if (formatUnit(slowKmh, SPEED_MODE) === formatUnit(fastKmh, SPEED_MODE)) {
    return formatUnit(fastKmh, SPEED_MODE);
  }
  return formatUnitRange(slowKmh, fastKmh, SPEED_MODE);
};

export const splitDistanceLabel = (metres: number): string =>
  formatUnit(metres / 1000, 'kilometer');

export const lapCountLabel = ({
  count,
  source,
}: {
  count: number;
  source: Exclude<LapSource, 'off'>;
}): string => {
  if (source === 'splits') {
    return formatPlural(count, {
      one: () => m.ui_laps_splits_one(),
      other: () => m.ui_laps_splits_other({ count: String(count) }),
    });
  }
  if (source === 'efforts') {
    return formatPlural(count, {
      one: () => m.ui_laps_efforts_one(),
      other: () => m.ui_laps_efforts_other({ count: String(count) }),
    });
  }
  return formatPlural(count, {
    one: () => m.ui_laps_pill_one(),
    other: () => m.ui_laps_pill_other({ count: String(count) }),
  });
};

export const lapPaceLabel = ({ secPerKm, sport }: { secPerKm: number; sport: Sport }): string => {
  if (sport === 'running') return m.ui_laps_pace({ pace: railPaceFromSecPerKm(secPerKm) });
  return formatUnit(3600 / secPerKm, SPEED_MODE);
};

const lapPaceRangeLabel = ({
  fastestSecPerKm,
  slowestSecPerKm,
  sport,
}: {
  fastestSecPerKm: number;
  slowestSecPerKm: number;
  sport: Sport;
}): string => {
  if (sport === 'running') {
    const from = railPaceFromSecPerKm(fastestSecPerKm);
    const to = railPaceFromSecPerKm(slowestSecPerKm);
    if (from === to) return m.ui_laps_pace({ pace: from });
    return m.ui_laps_pace_range({ from, to });
  }
  return speedRangeLabel({ slowKmh: 3600 / slowestSecPerKm, fastKmh: 3600 / fastestSecPerKm });
};

interface LapsRowLabels {
  disabled: boolean;
  primary: string;
  secondary: string;
}

const pendingRowLabel = ({
  source,
  set,
}: {
  source: Exclude<LapSource, 'off'>;
  set: LapSet | null;
}): LapsRowLabels | undefined => {
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
  return undefined;
};

const lapsRowSecondary = ({
  summary,
  sport,
}: {
  summary: ReturnType<typeof summarizeLaps>;
  sport: Sport;
}): string => {
  let range = '';
  const fastestPace = summary.fastest?.paceSecPerKm;
  const slowestPace = summary.slowest?.paceSecPerKm;
  if (fastestPace !== undefined && slowestPace !== undefined) {
    range = lapPaceRangeLabel({
      fastestSecPerKm: fastestPace,
      slowestSecPerKm: slowestPace,
      sport,
    });
  }

  let secondary = range;
  if (summary.avgHrRecovery !== undefined) {
    const bpm = formatNumber(summary.avgHrRecovery);
    if (range === '') {
      secondary = m.ui_laps_row_recovery({ bpm });
    } else {
      secondary = m.ui_laps_row_range_recovery({ range, bpm });
    }
  }
  return secondary;
};

export const lapsRowLabels = ({
  source,
  set,
  sport,
}: {
  source: LapSource;
  set: LapSet | null;
  sport: Sport;
}): LapsRowLabels => {
  if (source === 'off') {
    return { disabled: true, primary: m.ui_laps_row_off(), secondary: m.ui_laps_row_off_hint() };
  }
  const pending = pendingRowLabel({ source, set });
  if (pending) return pending;
  let summarySet = set;
  if (source === 'efforts' && set) summarySet = effortWorkSet(set);
  const count = summarySet?.analysis.length ?? 0;
  const countLabel = lapCountLabel({ count, source });
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
      value: lapPaceLabel({ secPerKm: summary.avgSecPerKm, sport }),
    });
  }
  return { disabled: false, primary, secondary: lapsRowSecondary({ summary, sport }) };
};

const effortValueLabel = ({ signal, value }: { signal: EffortSignal; value: number }): string => {
  switch (signal) {
    case 'power':
      return m.ui_laps_efforts_watts({ watts: statFormat.watts(value) });
    case 'pace':
      return m.ui_laps_pace({ pace: railPaceFromSecPerKm(value) });
    case 'hr':
      return m.ui_laps_efforts_bpm({ bpm: formatNumber(value) });
  }
};

export const effortChipLabel = ({
  set,
  efforts,
}: {
  set: LapSet;
  efforts: LapSetEfforts;
}): string => {
  const pattern = effortPattern(set);
  let summary = lapCountLabel({ count: effortWorkCount(set), source: 'efforts' });
  if (pattern) {
    summary = m.ui_laps_efforts_pattern({
      count: String(pattern.count),
      duration: statFormat.duration(pattern.movingTime),
    });
  }
  if (efforts.workAverage === undefined) return summary;
  return m.ui_laps_efforts_chip({
    summary,
    value: effortValueLabel({ signal: efforts.signal, value: efforts.workAverage }),
  });
};

interface LapsPickerDescriptions {
  effortLabel: string | undefined;
  nudge: string;
  deviceDescription: string;
  splitsDescription: string;
}

export const lapsPickerDescriptions = ({
  source,
  current,
  deviceLapCount,
  effortSet,
  limitedBy,
}: {
  source: LapSource;
  current: LapSet | null;
  deviceLapCount: number;
  effortSet: LapSet | null;
  limitedBy: EffortLimiter | undefined;
}): LapsPickerDescriptions => {
  let effortLabel: string | undefined;
  if (effortSet?.efforts) {
    effortLabel = effortChipLabel({ set: effortSet, efforts: effortSet.efforts });
  }
  let nudge = '';
  if (limitedBy) {
    nudge = NUDGE_BY_EFFORT_LIMITER[limitedBy].detect();
    if (effortSet) nudge = NUDGE_BY_EFFORT_LIMITER[limitedBy].precise();
  }
  let deviceDescription: string = m.ui_laps_device_none();
  if (source === 'device' && current) {
    deviceDescription = lapCountLabel({ count: current.analysis.length, source: 'device' });
  } else if (deviceLapCount > 0) {
    deviceDescription = m.ui_laps_device_desc({ count: String(deviceLapCount) });
  }
  let splitsDescription: string = m.ui_laps_splits_desc();
  if (source === 'splits') {
    splitsDescription = lapCountLabel({
      count: current?.analysis.length ?? 0,
      source: 'splits',
    });
  }
  return { effortLabel, nudge, deviceDescription, splitsDescription };
};

const effortName = ({
  set,
  lapIndex,
  sport,
}: {
  set: LapSet;
  lapIndex: number;
  sport: Sport;
}): string => {
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

export const lapName = ({
  set,
  lapIndex,
  source,
  sport,
}: {
  set: LapSet;
  lapIndex: number;
  source: LapSource;
  sport: Sport;
}): string => {
  if (source === 'efforts') return effortName({ set, lapIndex, sport });
  const number = String(lapIndex + 1);
  if (source === 'splits') return m.ui_split_label({ number });
  return m.ui_lap_label({ number });
};
