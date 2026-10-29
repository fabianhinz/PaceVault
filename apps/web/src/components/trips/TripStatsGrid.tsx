import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardGrid } from '@pacevault/ui/components/pvCardGrid/PvCardGrid.tsx';
import { PvStatTile } from '@pacevault/ui/components/pvStatTile/PvStatTile.tsx';
import { MetricLabel } from '@/components/metricLabel/index.tsx';
import type { MetricId } from '@/components/metricLabel/explanations.ts';
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatNumber,
} from '@/lib/format/formatters.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { computeTripTotals } from './tripStats.ts';

interface TripStatsGridProps {
  sessions: TrainingSession[];
}

export const TripStatsGrid: FC<TripStatsGridProps> = (props) => {
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
      value: formatNumber(totals.tss, 'integer-ungrouped'),
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
    <PvCard>
      <PvCardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <PvStatTile
            key={stat.key}
            title={stat.title}
            value={stat.value}
            unit={stat.unit}
            stat={stat.metricId}
            info={
              stat.metricId !== undefined ? (
                <MetricLabel metricId={stat.metricId} size="sm" iconOnly className="self-center" />
              ) : undefined
            }
          />
        ))}
      </PvCardGrid>
    </PvCard>
  );
};
