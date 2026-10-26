import type { FC, ReactNode } from 'react';
import { PageLink } from '@/routing/PageLink.tsx';
import { ChartNoAxesColumn, Pause, Timer, Wind } from 'lucide-react';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import { PvCrumbs } from '@pacevault/ui/components/pvCrumbs/PvCrumbs.tsx';
import { PvIconFact } from '@pacevault/ui/components/pvIconFact/PvIconFact.tsx';
import { PvStatTile } from '@pacevault/ui/components/pvStatTile/PvStatTile.tsx';
import { moreStatsTopics, pickPeak, pickZone, type MoreStats } from '@/lib/moreStats.ts';
import { METRIC_EXPLANATIONS, type MetricId } from '@/lib/explanations.ts';
import { formatNumber } from '@/lib/formatters.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { DECOUPLING_SCALE_PCT, DECOUPLING_WELL_PACED_PCT } from '@pacevault/engine/decoupling.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useMoreStats } from './hooks/useMoreStats.ts';
import { MeterBar } from './MeterBar.tsx';
import { HrZonesCell } from './HrZonesCell.tsx';
import { PeakPowerCell } from './PeakPowerCell.tsx';
import { statFormat } from './statFormat.ts';
import {
  LABEL_BY_ENERGY_BLOCKER,
  LABEL_BY_MORE_STATS_TOPIC,
  LABEL_BY_STRESS_METHOD,
} from '@/microcopy/moreStats.ts';

const RANGE_TRACK_SPAN = 0.3;
const INTENSITY_SCALE = 1.2;

const tileInfo = ({
  metricId,
  relatedMetricIds,
}: {
  metricId: MetricId;
  relatedMetricIds?: MetricId[];
}): ReactNode => (
  <MetricLabel
    metricId={metricId}
    relatedMetricIds={relatedMetricIds}
    size="sm"
    iconOnly
    className="self-center"
  />
);

const roundToTen = (value: number): number => Math.round(value / 10) * 10;
const rangeFraction = (factor: number): number =>
  (factor - (1 - RANGE_TRACK_SPAN)) / (2 * RANGE_TRACK_SPAN);

const loadNote = ({ stats, session }: { stats: MoreStats; session: TrainingSession }): string => {
  if (session.stressMethod === 'trimp' && stats.thresholdHrEstimated) {
    return m.ui_more_stats_load_from_hr_estimated();
  }
  return LABEL_BY_STRESS_METHOD[session.stressMethod]();
};

const loadCell = ({
  stats,
  session,
}: {
  stats: MoreStats;
  session: TrainingSession;
}): ReactNode => (
  <PvStatTile
    key="load"
    title={m.ui_more_stats_load()}
    stat={session.stressMethod}
    info={tileInfo({ metricId: session.stressMethod })}
    unit={METRIC_EXPLANATIONS[session.stressMethod].shortLabel}
    value={statFormat.integer(session.tss)}
    note={loadNote({ stats, session })}
  />
);

const caloriesCell = (stats: MoreStats): ReactNode => {
  const calories = stats.calories;
  if (calories === undefined) return null;
  const title = m.ui_more_stats_calories();
  if ('blockedBy' in calories) {
    return (
      <PvStatTile
        key="calories"
        title={title}
        stat="calories"
        info={tileInfo({ metricId: 'calories' })}
        value="--"
        unit="kcal"
        note={
          <PageLink to={{ page: 'settings', params: {} }} className="text-accent hover:underline">
            {LABEL_BY_ENERGY_BLOCKER[calories.blockedBy]()}
          </PageLink>
        }
      />
    );
  }
  return (
    <PvStatTile
      key="calories"
      title={title}
      stat="calories"
      info={tileInfo({ metricId: 'calories' })}
      value={statFormat.integer(roundToTen(calories.kcal))}
      unit="kcal"
      note={`±${statFormat.percent(calories.uncertainty)} %`}
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
    </PvStatTile>
  );
};

const movingTimeCell = (stats: MoreStats): ReactNode => {
  const moving = stats.movingTime;
  if (moving === undefined) return null;
  const crumbs: ReactNode[] = [
    <PvIconFact
      key="elapsed"
      icon={Timer}
      label={m.ui_more_stats_elapsed_label()}
      time={statFormat.duration(moving.elapsedS)}
    />,
  ];
  if (moving.coastingS !== undefined) {
    crumbs.push(
      <PvIconFact
        icon={Wind}
        label={m.ui_more_stats_coasting()}
        time={statFormat.duration(moving.coastingS)}
      />,
    );
  }
  crumbs.push(
    <PvIconFact
      icon={Pause}
      label={m.ui_more_stats_stopped_label()}
      time={statFormat.duration(moving.stoppedS)}
    />,
  );
  return (
    <PvStatTile
      key="moving"
      title={m.ui_more_stats_moving()}
      stat="movingTime"
      info={tileInfo({ metricId: 'movingTime' })}
      value={statFormat.duration(moving.movingS)}
      note={<PvCrumbs items={crumbs} />}
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
      secondary = { unit: 'VI', value: formatNumber(variability.index, 'fixed-two-decimals') };
    }
    return (
      <PvStatTile
        key="intensity"
        title={title}
        stat="intensityFactor"
        info={tileInfo({ metricId: 'intensityFactor', relatedMetricIds: ['variabilityIndex'] })}
        unit="IF"
        value={formatNumber(intensity.factor, 'fixed-two-decimals')}
        secondary={secondary}
      >
        <MeterBar
          sport={stats.sport}
          alpha={75}
          fill={{ to: intensity.factor / INTENSITY_SCALE }}
          mark={1 / INTENSITY_SCALE}
        />
      </PvStatTile>
    );
  }
  if (variability === undefined) return null;
  return (
    <PvStatTile
      key="intensity"
      title={title}
      stat="variabilityIndex"
      info={tileInfo({ metricId: 'variabilityIndex' })}
      unit="VI"
      value={formatNumber(variability.index, 'fixed-two-decimals')}
      note={
        <PvCrumbs
          items={[
            m.ui_more_stats_np({ watts: statFormat.watts(variability.np) }),
            m.ui_more_stats_avg_power({ watts: statFormat.watts(variability.avgPower) }),
          ]}
        />
      }
    />
  );
};

const peaksCell = (stats: MoreStats): ReactNode => {
  const peaks = stats.peaks;
  if (peaks === undefined || !pickPeak({ peaks, hovered: null })) return null;
  return <PeakPowerCell key="peaks" sport={stats.sport} peaks={peaks} />;
};

const stepLengthCell = (stats: MoreStats): ReactNode => {
  const step = stats.stepLength;
  if (step === undefined) return null;
  return (
    <PvStatTile
      key="step"
      title={m.ui_more_stats_step()}
      stat="stepLength"
      info={tileInfo({ metricId: 'stepLength' })}
      value={formatNumber(step.metres, 'fixed-two-decimals')}
      unit="m"
      note={`${statFormat.integer(step.stepsPerMinute)} spm`}
    />
  );
};

const hrZonesCell = (stats: MoreStats): ReactNode => {
  const zones = stats.hrZones;
  if (zones === undefined || !pickZone({ zones, hovered: null })) return null;
  return <HrZonesCell key="zones" zones={zones} />;
};

const decouplingCell = (stats: MoreStats): ReactNode => {
  const decoupling = stats.decoupling;
  if (decoupling === undefined) return null;
  let verdict = m.ui_more_stats_drifting();
  if (decoupling.pct < DECOUPLING_WELL_PACED_PCT) verdict = m.ui_more_stats_well_paced();
  return (
    <PvStatTile
      key="decoupling"
      title={m.ui_more_stats_decoupling()}
      stat="decoupling"
      info={tileInfo({ metricId: 'decoupling' })}
      value={formatNumber(decoupling.pct, 'signed-fixed-one-decimal')}
      unit="%"
      note={verdict}
    >
      <MeterBar
        sport={stats.sport}
        alpha={75}
        fill={{ to: decoupling.pct / DECOUPLING_SCALE_PCT }}
        mark={DECOUPLING_WELL_PACED_PCT / DECOUPLING_SCALE_PCT}
      />
    </PvStatTile>
  );
};

const STATS_CELLS = [
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

export const MoreStatsRow: FC<MoreStatsRowProps> = (props) => {
  const stats = useMoreStats({ session: props.session, records: props.records });
  const cells = [
    loadCell({ stats, session: props.session }),
    ...STATS_CELLS.map((cell) => cell(stats)),
  ].filter((cell) => cell !== null);
  const topics = moreStatsTopics(stats).map((topic) => LABEL_BY_MORE_STATS_TOPIC[topic]());

  return (
    <PvCollapsibleListItem
      testId="session-stats-row"
      avatar={<ChartNoAxesColumn size={20} aria-hidden className="shrink-0 text-text-secondary" />}
      primary={m.ui_more_stats_title()}
      secondary={topics.join(' · ')}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cells}</div>
    </PvCollapsibleListItem>
  );
};
