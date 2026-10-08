import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import type { MetricId } from '@/lib/explanations.ts';
import { formatDate, formatDistance, formatDuration } from '@/lib/formatters.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { computeTripTotals } from './tripStats.ts';

export const TripStatsGrid = (props: { sessions: TrainingSession[] }) => {
  const totals = computeTripTotals(props.sessions);

  let dateRange: ReactNode = '--';
  if (totals.startDate !== null && totals.endDate !== null) {
    const start = formatDate(totals.startDate);
    const end = formatDate(totals.endDate);
    dateRange = start === end ? start : `${start} – ${end}`;
  }

  const stats: Array<{
    key: string;
    label: string;
    value: ReactNode;
    unit?: string;
    metricId?: MetricId;
  }> = [
    { key: 'sessions', label: m.ui_stat_sessions(), value: totals.count },
    {
      key: 'distance',
      label: m.ui_stat_total_distance(),
      value: formatDistance(totals.distance),
    },
    {
      key: 'duration',
      label: m.ui_stat_total_duration(),
      value: formatDuration(totals.duration),
    },
    {
      key: 'load',
      label: m.ui_trip_stat_load(),
      value: totals.tss.toFixed(0),
      metricId: 'tripLoad',
    },
    { key: 'dates', label: m.ui_trip_stat_dates(), value: dateRange },
  ];

  let elevation: { value: ReactNode; unit?: string } = { value: '--' };
  if (totals.elevationGain !== undefined) {
    elevation = { value: `+${Math.round(totals.elevationGain)}`, unit: 'm' };
  }
  stats.push({
    key: 'elevation',
    label: m.ui_stat_elevation(),
    value: elevation.value,
    unit: elevation.unit,
  });

  return (
    <Card>
      <CardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <StatItem
            key={stat.key}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            metricId={stat.metricId}
          />
        ))}
      </CardGrid>
    </Card>
  );
};
