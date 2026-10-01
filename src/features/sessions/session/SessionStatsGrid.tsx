import { useMemo } from 'react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { formatDuration, formatDistance, formatPace, formatSpeed } from '@/lib/formatters.ts';
import { METRIC_EXPLANATIONS, type MetricId } from '@/lib/explanations.ts';
import { detectIntervals, detectProgressiveOverload } from '@/lib/laps.ts';
import type { TrainingSession, SessionLap } from '@/packages/engine/types.ts';

interface SessionStatsGridProps {
  session: TrainingSession;
  laps: SessionLap[];
}

const TREND_META = {
  stable: {
    label: m.ui_stat_trend_stable,
    className: 'text-text-secondary',
  },
  fading: {
    label: m.ui_stat_trend_fading,
    className: 'text-status-warning',
  },
  building: {
    label: m.ui_stat_trend_building,
    className: 'text-status-success',
  },
} as const;

export const SessionStatsGrid = (props: SessionStatsGridProps) => {
  const intervals = useMemo(() => detectIntervals(props.laps), [props.laps]);
  const overload = useMemo(() => detectProgressiveOverload(props.laps), [props.laps]);

  const intervalPairsWithHr = intervals.filter((p) => p.hrRecovery !== undefined);
  const avgRecovery =
    intervalPairsWithHr.length > 0
      ? intervalPairsWithHr.reduce((sum, p) => sum + (p.hrRecovery ?? 0), 0) /
        intervalPairsWithHr.length
      : 0;

  let recoveryMeta;
  if (avgRecovery > 25) {
    recoveryMeta = { label: m.ui_stat_recovery_strong(), className: 'text-status-success' };
  } else if (avgRecovery >= 15) {
    recoveryMeta = { label: m.ui_stat_recovery_adequate(), className: 'text-text-secondary' };
  } else {
    recoveryMeta = { label: m.ui_stat_recovery_slow(), className: 'text-status-warning' };
  }

  const stats: Array<{
    key: string;
    label: string;
    value: React.ReactNode;
    unit?: string;
    metricId?: MetricId;
    subDetail?: React.ReactNode;
  }> = [];

  // Row 1: Duration & Distance (always present)
  stats.push({
    key: 'duration',
    label: m.ui_stat_duration(),
    value: formatDuration(props.session.duration),
  });

  stats.push({
    key: 'distance',
    label: m.ui_stat_distance(),
    value: formatDistance(props.session.distance),
  });

  // Row 2: Stress Score & Avg HR
  stats.push({
    key: 'tss',
    label: METRIC_EXPLANATIONS[props.session.stressMethod].friendlyName,
    value: props.session.tss.toFixed(0),
    metricId: props.session.stressMethod,
  });

  stats.push({
    key: 'avgHr',
    label: m.ui_stat_avg_hr(),
    value: props.session.avgHr ?? '--',
    unit: props.session.avgHr ? 'bpm' : undefined,
    metricId: 'avgHr',
  });

  // Row 3: Sport-aware pace/speed (single card)
  if (props.session.sport === 'cycling') {
    let avgSpeed = props.session.avgSpeed;
    if (
      avgSpeed === undefined &&
      props.session.distance !== undefined &&
      props.session.duration > 0
    ) {
      avgSpeed = props.session.distance / props.session.duration;
    }
    if (avgSpeed !== undefined) {
      stats.push({
        key: 'avgSpeed',
        label: m.ui_stat_avg_speed(),
        value: formatSpeed(avgSpeed),
        metricId: 'avgSpeed',
      });
    }
  } else if (props.session.avgPace) {
    stats.push({
      key: 'avgPace',
      label: m.ui_stat_avg_pace(),
      value: formatPace(props.session.avgPace),
      metricId: 'avgPace',
    });
  }

  // Row 4: Merged power card (NP primary when both exist)
  if (props.session.normalizedPower !== undefined && props.session.avgPower !== undefined) {
    stats.push({
      key: 'power',
      label: m.ui_stat_norm_power(),
      value: props.session.normalizedPower,
      unit: 'W',
      metricId: 'normalizedPower',
      subDetail: (
        <Typography variant="caption" as="p">
          {m.ui_stat_avg_power_short({ value: props.session.avgPower })}
        </Typography>
      ),
    });
  } else if (props.session.avgPower !== undefined) {
    stats.push({
      key: 'power',
      label: m.ui_stat_avg_power(),
      value: props.session.avgPower,
      unit: 'W',
      metricId: 'avgPower',
    });
  }

  // Row 4b: GAP
  if (props.session.gap && props.session.sport === 'running') {
    stats.push({
      key: 'gap',
      label: m.ui_stat_grade_adj_pace(),
      value: formatPace(props.session.gap),
      metricId: 'gradeAdjustedPace',
    });
  }

  // Row 5: Elevation (absorbs altitude range) & Cadence
  if (props.session.elevationGain !== undefined) {
    const elevationSubParts: string[] = [];
    if (props.session.elevationLoss !== undefined) {
      elevationSubParts.push(`-${props.session.elevationLoss}m`);
    }
    if (props.session.minAltitude !== undefined) {
      elevationSubParts.push(
        `${Math.round(props.session.minAltitude)} — ${Math.round(props.session.maxAltitude ?? 0)}m`,
      );
    }
    stats.push({
      key: 'elevation',
      label: m.ui_stat_elevation(),
      value: `+${props.session.elevationGain}`,
      unit: 'm',
      metricId: 'elevation',
      subDetail:
        elevationSubParts.length > 0 ? (
          <Typography variant="caption" as="p">
            {elevationSubParts.join(' · ')}
          </Typography>
        ) : undefined,
    });
  }

  if (props.session.avgCadence !== undefined) {
    stats.push({
      key: 'cadence',
      label: m.ui_stat_cadence(),
      value: props.session.avgCadence,
      unit: 'rpm',
      metricId: 'cadence',
    });
  }

  // Row 6: Pacing Trend
  if (overload.lapCount >= 3) {
    const trend = TREND_META[overload.trend];
    stats.push({
      key: 'pacingTrend',
      label: m.ui_stat_pacing_trend(),
      value:
        overload.paceDriftPercent !== undefined
          ? m.ui_stat_drift({
              percent: `${overload.paceDriftPercent > 0 ? '+' : ''}${overload.paceDriftPercent}`,
            })
          : trend.label(),
      metricId: 'pacingTrend',
      subDetail: (
        <Typography variant="caption" as="p" className={trend.className}>
          {trend.label()}
        </Typography>
      ),
    });
  }

  // Row 7: Recovery
  if (intervalPairsWithHr.length > 0) {
    stats.push({
      key: 'recovery',
      label: m.ui_stat_recovery(),
      value: `${Math.round(avgRecovery)} bpm`,
      metricId: 'recovery',
      subDetail: (
        <Typography variant="caption" as="p" className={recoveryMeta.className}>
          {recoveryMeta.label}
        </Typography>
      ),
    });
  }

  const hasWarnings = props.session.sensorWarnings.length > 0;

  return (
    <Card>
      <CardGrid collapsedRows={2} title={m.ui_stat_stats()}>
        {stats.map((stat) => (
          <StatItem
            key={stat.key}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            metricId={stat.metricId}
            subDetail={stat.subDetail}
          />
        ))}
      </CardGrid>

      {hasWarnings && (
        <div className={cn('border-t border-white/10', 'mt-4 pt-4')}>
          <Typography variant="title" as="h3" color="warning" className="mb-2">
            {m.ui_stat_sensor_warnings()}
          </Typography>
          {props.session.sensorWarnings.map((w, i) => (
            <Typography key={i} variant="body1" className="text-status-warning/80 mt-1">
              {w}
            </Typography>
          ))}
        </div>
      )}
    </Card>
  );
};
