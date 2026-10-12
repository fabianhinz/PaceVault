import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesColumn } from 'lucide-react';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { SegmentBar } from '@/components/ui/SegmentBar.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { formatPace, formatRaceTime } from '@/lib/formatters.ts';
import {
  DECOUPLING_RATIO_LABELS,
  moreStatsTopics,
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
import { PeakAxis, PeakBars } from './PeakBars.tsx';
import { StatCell, StatLine } from './StatCell.tsx';

const integerFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
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
const watts = (value: number): string => integerFmt.format(value);
const duration = (seconds: number): string => formatRaceTime(Math.round(seconds));
const rangeFraction = (factor: number): number =>
  (factor - (1 - RANGE_TRACK_SPAN)) / (2 * RANGE_TRACK_SPAN);

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
        value="--"
        unit="kcal"
        lines={[
          <Typography key="link" variant="caption" as="p" noWrap className="h-4">
            <Link to="/settings" className="text-accent hover:underline">
              {BLOCKER_LABELS[calories.blockedBy]()}
            </Link>
          </Typography>,
          <StatLine key="empty" />,
        ]}
      />
    );
  }
  return (
    <StatCell
      key="calories"
      stat="calories"
      label={label}
      metricId="calories"
      value={integerFmt.format(roundToTen(calories.kcal))}
      unit="kcal"
      visual={
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
      lines={[
        <StatLine key="range">
          {integerFmt.format(roundToTen(calories.lowKcal))}–
          {integerFmt.format(roundToTen(calories.highKcal))} kcal
        </StatLine>,
        <StatLine key="empty" />,
      ]}
    />
  );
};

const movingTimeCell = (stats: MoreStats): ReactNode => {
  const moving = stats.movingTime;
  if (moving === undefined) return null;
  return (
    <StatCell
      key="moving"
      stat="moving"
      label={m.ui_more_stats_moving()}
      metricId="movingTime"
      value={duration(moving.movingS)}
      lines={[
        <StatLine key="elapsed">
          {m.ui_more_stats_elapsed({ time: duration(moving.elapsedS) })}
        </StatLine>,
        <StatLine key="stopped">
          {m.ui_more_stats_stopped({ time: duration(moving.stoppedS) })}
        </StatLine>,
      ]}
    />
  );
};

const workCell = (stats: MoreStats): ReactNode => {
  const work = stats.work;
  if (work === undefined) return null;
  let avg = '';
  if (work.avgPower !== undefined) avg = m.ui_more_stats_avg_power({ watts: watts(work.avgPower) });
  return (
    <StatCell
      key="work"
      stat="work"
      label={m.ui_more_stats_work()}
      metricId="work"
      value={integerFmt.format(work.kj)}
      unit="kJ"
      lines={[<StatLine key="avg">{avg}</StatLine>, <StatLine key="empty" />]}
    />
  );
};

const intensityCell = (stats: MoreStats): ReactNode => {
  const intensity = stats.intensity;
  if (intensity === undefined) return null;
  return (
    <StatCell
      key="intensity"
      stat="intensity"
      label={m.ui_more_stats_intensity()}
      metricId="intensityFactor"
      value={twoDecimalFmt.format(intensity.factor)}
      lines={[
        <StatLine key="np">{m.ui_more_stats_np({ watts: watts(intensity.np) })}</StatLine>,
        <StatLine key="ftp">{m.ui_more_stats_ftp({ watts: watts(intensity.ftp) })}</StatLine>,
      ]}
    />
  );
};

const variabilityCell = (stats: MoreStats): ReactNode => {
  const variability = stats.variability;
  if (variability === undefined) return null;
  return (
    <StatCell
      key="variability"
      stat="variability"
      label={m.ui_more_stats_variability()}
      metricId="variabilityIndex"
      value={twoDecimalFmt.format(variability.index)}
      lines={[
        <StatLine key="np">{m.ui_more_stats_np({ watts: watts(variability.np) })}</StatLine>,
        <StatLine key="avg">
          {m.ui_more_stats_avg_power({ watts: watts(variability.avgPower) })}
        </StatLine>,
      ]}
    />
  );
};

const peaksCell = (stats: MoreStats): ReactNode => {
  const peaks = stats.peaks;
  if (peaks === undefined) return null;
  const highlighted = peaks.slots[peaks.highlight];
  if (highlighted?.watts === undefined) return null;
  let scaleLine = m.ui_more_stats_scaled_to_best();
  if (peaks.ftp !== undefined) scaleLine = m.ui_more_stats_ftp_line({ watts: watts(peaks.ftp) });
  return (
    <StatCell
      key="peaks"
      stat="peaks"
      label={m.ui_more_stats_peaks()}
      metricId="peakPower"
      value={watts(highlighted.watts)}
      unit={`W · ${highlighted.label}`}
      visual={
        <PeakBars
          sport={stats.sport}
          watts={peaks.slots.map((slot) => slot.watts)}
          highlight={peaks.highlight}
          ftp={peaks.ftp}
        />
      }
      lines={[<PeakAxis key="axis" />, <StatLine key="scale">{scaleLine}</StatLine>]}
    />
  );
};

const coastingCell = (stats: MoreStats): ReactNode => {
  const coasting = stats.coasting;
  if (coasting === undefined) return null;
  return (
    <StatCell
      key="coasting"
      stat="coasting"
      label={m.ui_more_stats_coasting()}
      metricId="coasting"
      value={duration(coasting.seconds)}
      visual={<MeterBar sport={stats.sport} alpha={75} fill={{ to: coasting.share }} />}
      lines={[
        <StatLine key="share">
          {m.ui_more_stats_coast_share({ percent: integerFmt.format(coasting.share * 100) })}
        </StatLine>,
        <StatLine key="rule">{m.ui_more_stats_coast_rule()}</StatLine>,
      ]}
    />
  );
};

const stepLengthCell = (stats: MoreStats): ReactNode => {
  const step = stats.stepLength;
  if (step === undefined) return null;
  let pace = '';
  if (step.paceSecPerKm !== undefined) {
    pace = m.ui_more_stats_pace({ pace: formatPace(step.paceSecPerKm) });
  }
  return (
    <StatCell
      key="step"
      stat="step"
      label={m.ui_more_stats_step()}
      metricId="stepLength"
      value={twoDecimalFmt.format(step.metres)}
      unit="m"
      lines={[
        <StatLine key="spm">{integerFmt.format(step.stepsPerMinute)} spm</StatLine>,
        <StatLine key="pace">{pace}</StatLine>,
      ]}
    />
  );
};

const hrZonesCell = (stats: MoreStats): ReactNode => {
  const zones = stats.hrZones;
  if (zones === undefined) return null;
  const dominant = zones.zones[zones.dominant];
  if (dominant === undefined) return null;
  return (
    <StatCell
      key="zones"
      stat="zones"
      label={m.ui_more_stats_zones()}
      metricId="trainingZones"
      value={dominant.zone}
      unit={`${integerFmt.format((dominant.seconds / zones.totalSeconds) * 100)} %`}
      visual={
        <SegmentBar
          segments={zones.zones.map((zone) => ({
            key: zone.zone,
            value: zone.seconds,
            color: zone.color,
          }))}
        />
      }
      lines={[
        <StatLine key="hard">
          {m.ui_more_stats_zones_hard({ time: duration(zones.hardSeconds) })}
        </StatLine>,
        <StatLine key="easy">
          {m.ui_more_stats_zones_easy({ time: duration(zones.easySeconds) })}
        </StatLine>,
      ]}
    />
  );
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
      value={decouplingFmt.format(decoupling.pct)}
      unit="%"
      visual={
        <MeterBar
          sport={stats.sport}
          alpha={75}
          fill={{ to: decoupling.pct / DECOUPLING_SCALE_PCT }}
          mark={DECOUPLING_WELL_PACED_PCT / DECOUPLING_SCALE_PCT}
        />
      }
      lines={[
        <StatLine key="ratio">
          {DECOUPLING_RATIO_LABELS[decoupling.ratio]} {twoDecimalFmt.format(decoupling.firstHalf)}→
          {twoDecimalFmt.format(decoupling.secondHalf)}
        </StatLine>,
        <StatLine key="verdict">{verdict}</StatLine>,
      ]}
    />
  );
};

const CELLS = [
  caloriesCell,
  movingTimeCell,
  workCell,
  intensityCell,
  variabilityCell,
  peaksCell,
  coastingCell,
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
