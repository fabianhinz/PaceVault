import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatTile } from '@/components/ui/StatTile.tsx';
import type { MetricId } from '@/lib/explanations.ts';
import { formatDate, formatDistance, formatDuration } from '@/lib/formatters.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { computeTripTotals } from './tripStats.ts';

export const TripStatsGrid = (props: { sessions: TrainingSession[] }) => {
  const totals = computeTripTotals(props.sessions);

  let dateRange = '--';
  if (totals.startDate !== null && totals.endDate !== null) {
    const start = formatDate(totals.startDate);
    const end = formatDate(totals.endDate);
    dateRange = start === end ? start : `${start} – ${end}`;
  }

  const stats: Array<{
    key: string;
    title: string;
    value: string;
    unit?: string;
    metricId?: MetricId;
  }> = [
    { key: 'sessions', title: m.ui_stat_sessions(), value: String(totals.count) },
    {
      key: 'distance',
      title: m.ui_stat_total_distance(),
      value: formatDistance(totals.distance),
    },
    {
      key: 'duration',
      title: m.ui_stat_total_duration(),
      value: formatDuration(totals.duration),
    },
    {
      key: 'load',
      title: m.ui_trip_stat_load(),
      value: totals.tss.toFixed(0),
      metricId: 'tripLoad',
    },
    { key: 'dates', title: m.ui_trip_stat_dates(), value: dateRange },
  ];

  let elevation: { value: string; unit?: string } = { value: '--' };
  if (totals.elevationGain !== undefined) {
    elevation = { value: `+${Math.round(totals.elevationGain)}`, unit: 'm' };
  }
  stats.push({
    key: 'elevation',
    title: m.ui_stat_elevation(),
    value: elevation.value,
    unit: elevation.unit,
  });

  return (
    <Card>
      <CardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <StatTile
            key={stat.key}
            title={stat.title}
            value={stat.value}
            unit={stat.unit}
            metricId={stat.metricId}
          />
        ))}
      </CardGrid>
    </Card>
  );
};
