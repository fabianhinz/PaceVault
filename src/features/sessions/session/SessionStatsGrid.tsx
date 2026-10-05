import { useMemo } from 'react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { formatDuration, formatDistance } from '@/lib/formatters.ts';
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

  stats.push({
    key: 'tss',
    label: METRIC_EXPLANATIONS[props.session.stressMethod].friendlyName,
    value: props.session.tss.toFixed(0),
    metricId: props.session.stressMethod,
  });

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
