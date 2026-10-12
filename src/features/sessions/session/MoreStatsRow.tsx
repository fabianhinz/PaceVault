import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesColumn, Pause, Wind, type LucideIcon } from 'lucide-react';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import {
  moreStatsTopics,
  pickPeak,
  pickZone,
  type MoreStats,
  type MoreStatsTopic,
} from '@/lib/moreStats.ts';
import { DECOUPLING_SCALE_PCT, DECOUPLING_WELL_PACED_PCT } from '@/packages/engine/decoupling.ts';
import type { EnergyBlocker } from '@/packages/engine/energy.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { useMoreStats } from './hooks/useMoreStats.ts';
import { MeterBar } from './MeterBar.tsx';
import { HrZonesCell } from './HrZonesCell.tsx';
import { PeakPowerCell } from './PeakPowerCell.tsx';
import { StatCaption, StatCell, StatPair, StatValue } from './StatCell.tsx';
import { duration, integerFmt, percent, watts } from './statFormat.ts';

const twoDecimalFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const decouplingFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'negative',
});

const RANGE_TRACK_SPAN = 0.3;
const INTENSITY_SCALE = 1.2;

const TOPIC_LABELS: Record<MoreStatsTopic, () => string> = {
  calories: m.ui_more_stats_topic_calories,
  power: m.ui_more_stats_topic_power,
  stride: m.ui_more_stats_topic_stride,
  zones: m.ui_more_stats_topic_zones,
  decoupling: m.ui_more_stats_topic_decoupling,
};

const BLOCKER_LABELS: Record<EnergyBlocker, () => string> = {
  weight: m.ui_more_stats_add_weight,
  age: m.ui_more_stats_add_birth_year,
  weightAndAge: m.ui_more_stats_add_weight_birth_year,
};

const roundToTen = (value: number): number => Math.round(value / 10) * 10;
const rangeFraction = (factor: number): number =>
  (factor - (1 - RANGE_TRACK_SPAN)) / (2 * RANGE_TRACK_SPAN);

const IconFact = (props: { icon: LucideIcon; label: string; time: string }) => (
  <span title={props.label} className="inline-flex items-center gap-1">
    <props.icon size={12} strokeWidth={2} aria-hidden className="shrink-0" />
    <span className="sr-only">{props.label}</span>
    {props.time}
  </span>
);

const caloriesCell = (stats: MoreStats): ReactNode => {
  const calories = stats.calories;
  if (calories === undefined) return null;
  const label = m.ui_more_stats_calories();
  if ('blockedBy' in calories) {
    return (
      <StatCell
        key="calories"
        stat="calories"
        label={label}
        metricId="calories"
        info1={<StatValue value="--" unit="kcal" />}
        chart={
          <Typography variant="caption" as="p" noWrap zeroMinWidth>
            <Link to="/settings" className="text-accent hover:underline">
              {BLOCKER_LABELS[calories.blockedBy]()}
            </Link>
          </Typography>
        }
      />
    );
  }
  return (
    <StatCell
      key="calories"
      stat="calories"
      label={label}
      metricId="calories"
      info1={<StatValue value={integerFmt.format(roundToTen(calories.kcal))} unit="kcal" />}
      info2={<StatCaption>±{percent(calories.uncertainty)} %</StatCaption>}
      chart={
        <MeterBar
          sport={stats.sport}
          alpha={50}
          fill={{
            from: rangeFraction(1 - calories.uncertainty),
            to: rangeFraction(1 + calories.uncertainty),
          }}
          tick={rangeFraction(1)}
        />
      }
    />
  );
};

const movingTimeCell = (stats: MoreStats): ReactNode => {
  const moving = stats.movingTime;
  if (moving === undefined) return null;
  const stopped = duration(moving.stoppedS);
  let chart: ReactNode = <StatCaption>{m.ui_more_stats_stopped({ time: stopped })}</StatCaption>;
  if (moving.coastingS !== undefined) {
    chart = (
      <StatPair
        start={
          <IconFact
            icon={Wind}
            label={m.ui_more_stats_coasting()}
            time={duration(moving.coastingS)}
          />
        }
        end={<IconFact icon={Pause} label={m.ui_more_stats_stopped_label()} time={stopped} />}
      />
    );
  }
  return (
    <StatCell
      key="moving"
      stat="moving"
      label={m.ui_more_stats_moving()}
      metricId="movingTime"
      info1={duration(moving.movingS)}
      info2={
        <StatCaption>{m.ui_more_stats_of_total({ time: duration(moving.elapsedS) })}</StatCaption>
      }
      chart={chart}
    />
  );
};

const intensityCell = (stats: MoreStats): ReactNode => {
  const intensity = stats.intensity;
  const variability = stats.variability;
  const label = m.ui_more_stats_intensity();
  if (intensity !== undefined) {
    let info2: ReactNode = null;
    if (variability !== undefined) {
      info2 = (
        <Typography variant="h3" as="p" tabularNums noWrap>
          <StatValue value={twoDecimalFmt.format(variability.index)} lead="VI" />
        </Typography>
      );
    }
    return (
      <StatCell
        key="intensity"
        stat="intensity"
        label={label}
        metricId="intensityFactor"
        relatedMetricIds={['variabilityIndex']}
        info1={<StatValue value={twoDecimalFmt.format(intensity.factor)} lead="IF" />}
        info2={info2}
        chart={
          <MeterBar
            sport={stats.sport}
            alpha={75}
            fill={{ to: intensity.factor / INTENSITY_SCALE }}
            mark={1 / INTENSITY_SCALE}
          />
        }
      />
    );
  }
  if (variability === undefined) return null;
  return (
    <StatCell
      key="intensity"
      stat="intensity"
      label={label}
      metricId="variabilityIndex"
      info1={<StatValue value={twoDecimalFmt.format(variability.index)} lead="VI" />}
      chart={
        <StatPair
          start={m.ui_more_stats_np({ watts: watts(variability.np) })}
          end={m.ui_more_stats_avg_power({ watts: watts(variability.avgPower) })}
        />
      }
    />
  );
};

const peaksCell = (stats: MoreStats): ReactNode => {
  const peaks = stats.peaks;
  if (peaks === undefined || !pickPeak(peaks, null)) return null;
  return <PeakPowerCell key="peaks" sport={stats.sport} peaks={peaks} />;
};

const stepLengthCell = (stats: MoreStats): ReactNode => {
  const step = stats.stepLength;
  if (step === undefined) return null;
  return (
    <StatCell
      key="step"
      stat="step"
      label={m.ui_more_stats_step()}
      metricId="stepLength"
      info1={<StatValue value={twoDecimalFmt.format(step.metres)} unit="m" />}
      info2={<StatCaption>{integerFmt.format(step.stepsPerMinute)} spm</StatCaption>}
    />
  );
};

const hrZonesCell = (stats: MoreStats): ReactNode => {
  const zones = stats.hrZones;
  if (zones === undefined || !pickZone(zones, null)) return null;
  return <HrZonesCell key="zones" zones={zones} />;
};

const decouplingCell = (stats: MoreStats): ReactNode => {
  const decoupling = stats.decoupling;
  if (decoupling === undefined) return null;
  let verdict = m.ui_more_stats_drifting();
  if (decoupling.pct < DECOUPLING_WELL_PACED_PCT) verdict = m.ui_more_stats_well_paced();
  return (
    <StatCell
      key="decoupling"
      stat="decoupling"
      label={m.ui_more_stats_decoupling()}
      metricId="decoupling"
      info1={<StatValue value={decouplingFmt.format(decoupling.pct)} unit="%" />}
      info2={<StatCaption>{verdict}</StatCaption>}
      chart={
        <MeterBar
          sport={stats.sport}
          alpha={75}
          fill={{ to: decoupling.pct / DECOUPLING_SCALE_PCT }}
          mark={DECOUPLING_WELL_PACED_PCT / DECOUPLING_SCALE_PCT}
        />
      }
    />
  );
};

const CELLS = [
  caloriesCell,
  movingTimeCell,
  intensityCell,
  peaksCell,
  stepLengthCell,
  hrZonesCell,
  decouplingCell,
];

interface MoreStatsRowProps {
  session: TrainingSession;
  records: SessionRecord[];
}

export const MoreStatsRow = (props: MoreStatsRowProps) => {
  const stats = useMoreStats(props.session, props.records);
  const cells = CELLS.map((cell) => cell(stats)).filter((cell) => cell !== null);
  if (cells.length === 0) return null;
  const topics = moreStatsTopics(stats).map((topic) => TOPIC_LABELS[topic]());

  return (
    <CollapsibleListItem
      testId="session-stats-row"
      avatar={<ChartNoAxesColumn size={20} aria-hidden className="shrink-0 text-text-secondary" />}
      primary={m.ui_more_stats_title()}
      secondary={topics.length > 0 ? topics.join(' · ') : undefined}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cells}</div>
    </CollapsibleListItem>
  );
};
