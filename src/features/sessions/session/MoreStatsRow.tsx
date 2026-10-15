import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesColumn, Pause, Timer, Wind } from 'lucide-react';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { Crumbs, IconFact, StatTile } from '@/components/ui/StatTile.tsx';
import {
  moreStatsTopics,
  pickPeak,
  pickZone,
  type MoreStats,
  type MoreStatsTopic,
} from '@/lib/moreStats.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { DECOUPLING_SCALE_PCT, DECOUPLING_WELL_PACED_PCT } from '@/packages/engine/decoupling.ts';
import type { EnergyBlocker } from '@/packages/engine/energy.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { useMoreStats } from './hooks/useMoreStats.ts';
import { MeterBar } from './MeterBar.tsx';
import { HrZonesCell } from './HrZonesCell.tsx';
import { PeakPowerCell } from './PeakPowerCell.tsx';
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
  load: m.ui_more_stats_topic_load,
  calories: m.ui_more_stats_topic_calories,
  power: m.ui_more_stats_topic_power,
  stride: m.ui_more_stats_topic_stride,
  zones: m.ui_more_stats_topic_zones,
};

const LOAD_SOURCES: Record<TrainingSession['stressMethod'], () => string> = {
  tss: m.ui_more_stats_load_from_power,
  trimp: m.ui_more_stats_load_from_hr,
  duration: m.ui_more_stats_load_from_duration,
};

const BLOCKER_LABELS: Record<EnergyBlocker, () => string> = {
  weight: m.ui_more_stats_add_weight,
  age: m.ui_more_stats_add_birth_year,
  weightAndAge: m.ui_more_stats_add_weight_birth_year,
};

const roundToTen = (value: number): number => Math.round(value / 10) * 10;
const rangeFraction = (factor: number): number =>
  (factor - (1 - RANGE_TRACK_SPAN)) / (2 * RANGE_TRACK_SPAN);

const loadCell = (_stats: MoreStats, session: TrainingSession): ReactNode => (
  <StatTile
    key="load"
    title={m.ui_more_stats_load()}
    metricId={session.stressMethod}
    unit={METRIC_EXPLANATIONS[session.stressMethod].shortLabel}
    value={integerFmt.format(session.tss)}
    note={LOAD_SOURCES[session.stressMethod]()}
  />
);

const caloriesCell = (stats: MoreStats): ReactNode => {
  const calories = stats.calories;
  if (calories === undefined) return null;
  const title = m.ui_more_stats_calories();
  if ('blockedBy' in calories) {
    return (
      <StatTile
        key="calories"
        title={title}
        metricId="calories"
        value="--"
        unit="kcal"
        note={
          <Link to="/settings" className="text-accent hover:underline">
            {BLOCKER_LABELS[calories.blockedBy]()}
          </Link>
        }
      />
    );
  }
  return (
    <StatTile
      key="calories"
      title={title}
      metricId="calories"
      value={integerFmt.format(roundToTen(calories.kcal))}
      unit="kcal"
      note={`±${percent(calories.uncertainty)} %`}
    >
      <MeterBar
        sport={stats.sport}
        alpha={50}
        fill={{
          from: rangeFraction(1 - calories.uncertainty),
          to: rangeFraction(1 + calories.uncertainty),
        }}
        tick={rangeFraction(1)}
      />
    </StatTile>
  );
};

const movingTimeCell = (stats: MoreStats): ReactNode => {
  const moving = stats.movingTime;
  if (moving === undefined) return null;
  const crumbs: ReactNode[] = [
    <IconFact
      key="elapsed"
      icon={Timer}
      label={m.ui_more_stats_elapsed_label()}
      time={duration(moving.elapsedS)}
    />,
  ];
  if (moving.coastingS !== undefined) {
    crumbs.push(
      <IconFact icon={Wind} label={m.ui_more_stats_coasting()} time={duration(moving.coastingS)} />,
    );
  }
  crumbs.push(
    <IconFact
      icon={Pause}
      label={m.ui_more_stats_stopped_label()}
      time={duration(moving.stoppedS)}
    />,
  );
  return (
    <StatTile
      key="moving"
      title={m.ui_more_stats_moving()}
      metricId="movingTime"
      value={duration(moving.movingS)}
      note={<Crumbs items={crumbs} />}
    />
  );
};

const intensityCell = (stats: MoreStats): ReactNode => {
  const intensity = stats.intensity;
  const variability = stats.variability;
  const title = m.ui_more_stats_intensity();
  if (intensity !== undefined) {
    let secondary: { value: string; unit: string } | undefined = undefined;
    if (variability !== undefined) {
      secondary = { unit: 'VI', value: twoDecimalFmt.format(variability.index) };
    }
    return (
      <StatTile
        key="intensity"
        title={title}
        metricId="intensityFactor"
        relatedMetricIds={['variabilityIndex']}
        unit="IF"
        value={twoDecimalFmt.format(intensity.factor)}
        secondary={secondary}
      >
        <MeterBar
          sport={stats.sport}
          alpha={75}
          fill={{ to: intensity.factor / INTENSITY_SCALE }}
          mark={1 / INTENSITY_SCALE}
        />
      </StatTile>
    );
  }
  if (variability === undefined) return null;
  return (
    <StatTile
      key="intensity"
      title={title}
      metricId="variabilityIndex"
      unit="VI"
      value={twoDecimalFmt.format(variability.index)}
      note={
        <Crumbs
          items={[
            m.ui_more_stats_np({ watts: watts(variability.np) }),
            m.ui_more_stats_avg_power({ watts: watts(variability.avgPower) }),
          ]}
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
    <StatTile
      key="step"
      title={m.ui_more_stats_step()}
      metricId="stepLength"
      value={twoDecimalFmt.format(step.metres)}
      unit="m"
      note={`${integerFmt.format(step.stepsPerMinute)} spm`}
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
    <StatTile
      key="decoupling"
      title={m.ui_more_stats_decoupling()}
      metricId="decoupling"
      value={decouplingFmt.format(decoupling.pct)}
      unit="%"
      note={verdict}
    >
      <MeterBar
        sport={stats.sport}
        alpha={75}
        fill={{ to: decoupling.pct / DECOUPLING_SCALE_PCT }}
        mark={DECOUPLING_WELL_PACED_PCT / DECOUPLING_SCALE_PCT}
      />
    </StatTile>
  );
};

const CELLS = [
  loadCell,
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
  const cells = CELLS.map((cell) => cell(stats, props.session)).filter((cell) => cell !== null);
  const topics = moreStatsTopics(stats).map((topic) => TOPIC_LABELS[topic]());

  return (
    <CollapsibleListItem
      testId="session-stats-row"
      avatar={<ChartNoAxesColumn size={20} aria-hidden className="shrink-0 text-text-secondary" />}
      primary={m.ui_more_stats_title()}
      secondary={topics.join(' · ')}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cells}</div>
    </CollapsibleListItem>
  );
};
