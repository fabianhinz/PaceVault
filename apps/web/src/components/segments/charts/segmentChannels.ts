import {
  ArrowUpDown,
  Gauge,
  Heart,
  Mountain,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import {
  railFixed1,
  railGain,
  railInt,
  railLoss,
  railPace,
  railPaceFromSecPerKm,
  railSigned1,
} from '@/components/charts/railFormat.ts';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import type { PassSeries, SegmentChannel } from './segmentChartRows.ts';

interface ChannelRest {
  header: string;
  value: string;
  secondary?: string;
}

interface RestInput {
  series: PassSeries;
  segment: MatchedSegment;
  pass: StoredSegmentPass;
}

interface ChannelSpec {
  title: () => string;
  color: TokenColor;
  reversed: boolean;
  format: (value: number | null) => string;
  rest: (input: RestInput) => ChannelRest;
  bestAtRest: boolean;
}

const METERS_PER_KM = 1000;
const MPS_TO_KMH = 3.6;

const present = (values: Array<number | null>): number[] =>
  values.filter((value): value is number => value !== null);

const mean = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const extreme = ({ values, pick }: { values: number[]; pick: 'max' | 'min' }): number | null => {
  if (values.length === 0) return null;
  if (pick === 'max') return values.reduce((best, value) => Math.max(best, value));
  return values.reduce((best, value) => Math.min(best, value));
};

const elevationChange = (values: number[]): { gain: number; loss: number } => {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const current = values[i];
    const previous = values[i - 1];
    if (current === undefined || previous === undefined) continue;
    if (current > previous) gain += current - previous;
    if (current < previous) loss += previous - current;
  }
  return { gain, loss };
};

const averageAndMax =
  ({ channel, format }: { channel: SegmentChannel; format: (value: number | null) => string }) =>
  (input: RestInput): ChannelRest => {
    const values = present(input.series.values[channel]);
    return {
      header: m.ui_rail_avg(),
      value: format(mean(values)),
      secondary: `${m.ui_rail_max()} ${format(extreme({ values, pick: 'max' }))}`,
    };
  };

const segmentSpeedKmh = (input: RestInput): number =>
  (input.segment.distanceMeters / input.pass.movingSec) * MPS_TO_KMH;

const segmentPaceSecPerKm = (input: RestInput): number =>
  input.pass.movingSec / (input.segment.distanceMeters / METERS_PER_KM);

const segmentGradePercent = (input: RestInput): number | null => {
  if (input.segment.netElevationMeters === null) return null;
  return (input.segment.netElevationMeters / input.segment.distanceMeters) * 100;
};

export const SPEC_BY_SEGMENT_CHANNEL: Record<SegmentChannel, ChannelSpec> = {
  hr: {
    title: m.ui_chart_title_hr,
    color: tokens.chartHr,
    reversed: false,
    bestAtRest: true,
    format: railInt,
    rest: averageAndMax({ channel: 'hr', format: railInt }),
  },
  power: {
    title: m.ui_zones_tab_power,
    color: tokens.chartPower,
    reversed: false,
    bestAtRest: true,
    format: railInt,
    rest: averageAndMax({ channel: 'power', format: railInt }),
  },
  speed: {
    title: m.ui_laps_col_speed,
    color: tokens.chartSpeed,
    reversed: false,
    bestAtRest: true,
    format: railFixed1,
    rest: (input) => ({
      header: m.ui_rail_avg(),
      value: railFixed1(segmentSpeedKmh(input)),
      secondary: `${m.ui_rail_max()} ${railFixed1(extreme({ values: present(input.series.values.speed), pick: 'max' }))}`,
    }),
  },
  pace: {
    title: m.ui_zones_tab_pace,
    color: tokens.chartPace,
    reversed: true,
    bestAtRest: true,
    format: railPace,
    rest: (input) => ({
      header: m.ui_rail_avg(),
      value: railPaceFromSecPerKm(segmentPaceSecPerKm(input)),
      secondary: `${m.ui_rail_best()} ${railPace(extreme({ values: present(input.series.values.pace), pick: 'min' }))}`,
    }),
  },
  gap: {
    title: m.exp_grade_adjusted_pace_friendly_name,
    color: tokens.chartGap,
    reversed: true,
    bestAtRest: true,
    format: railPace,
    rest: (input) => ({
      header: m.ui_rail_avg(),
      value: railPace(mean(present(input.series.values.gap))),
    }),
  },
  elevation: {
    title: m.ui_stat_elevation,
    color: tokens.chartElevation,
    reversed: false,
    bestAtRest: false,
    format: railInt,
    rest: (input) => {
      const change = elevationChange(present(input.series.values.elevation));
      return { header: '', value: railGain(change.gain), secondary: `${railLoss(change.loss)} m` };
    },
  },
  grade: {
    title: m.ui_chart_title_grade,
    color: tokens.chartGrade,
    reversed: false,
    bestAtRest: false,
    format: railSigned1,
    rest: (input) => ({
      header: m.ui_rail_avg(),
      value: railSigned1(segmentGradePercent(input)),
      secondary: `${m.ui_rail_max()} ${railSigned1(extreme({ values: present(input.series.values.grade), pick: 'max' }))}`,
    }),
  },
  cadence: {
    title: m.ui_stat_cadence,
    color: tokens.chartCadence,
    reversed: false,
    bestAtRest: false,
    format: railInt,
    rest: averageAndMax({ channel: 'cadence', format: railInt }),
  },
};

const ICON_BY_CHANNEL: Record<Exclude<SegmentChannel, 'cadence'>, LucideIcon> = {
  hr: Heart,
  power: Zap,
  speed: Gauge,
  pace: Timer,
  gap: ArrowUpDown,
  elevation: Mountain,
  grade: TrendingUp,
};

export const channelIcon = ({
  channel,
  sport,
}: {
  channel: SegmentChannel;
  sport: Sport;
}): LucideIcon => {
  if (channel === 'cadence') return ICON_BY_SPORT[sport];
  return ICON_BY_CHANNEL[channel];
};

const UNIT_BY_CHANNEL: Record<Exclude<SegmentChannel, 'cadence'>, string> = {
  hr: 'bpm',
  power: 'W',
  speed: 'km/h',
  pace: '/km',
  gap: '/km',
  elevation: 'm',
  grade: '%',
};

export const channelUnit = ({
  channel,
  sport,
}: {
  channel: SegmentChannel;
  sport: Sport;
}): string => {
  if (channel !== 'cadence') return UNIT_BY_CHANNEL[channel];
  if (sport === 'running') return 'spm';
  return 'rpm';
};
