import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import { formatDate, formatDistance } from '@/lib/formatters.ts';
import type { StudioRoute } from '@/store/studio.ts';

// The complete stat inventory for a route. The first entries repeat the
// header's secondary line in the same order, so users never have to combine
// two places — expanding the grid reveals everything.
export const RouteStatsGrid = (props: { route: StudioRoute }) => {
  const stats: Array<{ key: string; label: string; value: ReactNode; unit?: string }> = [
    {
      key: 'distance',
      label: m.ui_studio_stat_distance(),
      value: formatDistance(props.route.distance),
    },
  ];

  if (props.route.elevation) {
    stats.push(
      {
        key: 'gain',
        label: m.ui_studio_stat_elev_gain(),
        value: `+${Math.round(props.route.elevation.gain)}`,
        unit: 'm',
      },
      {
        key: 'loss',
        label: m.ui_studio_stat_elev_loss(),
        value: `-${Math.round(props.route.elevation.loss)}`,
        unit: 'm',
      },
      {
        key: 'min',
        label: m.ui_studio_stat_min_elevation(),
        value: Math.round(props.route.elevation.min),
        unit: 'm',
      },
      {
        key: 'max',
        label: m.ui_studio_stat_max_elevation(),
        value: Math.round(props.route.elevation.max),
        unit: 'm',
      },
      {
        key: 'grade',
        label: m.ui_studio_stat_max_grade(),
        value: props.route.elevation.maxGrade.toFixed(1),
        unit: '%',
      },
    );
  }

  stats.push(
    {
      key: 'imported',
      label: m.ui_studio_stat_imported(),
      value: formatDate(props.route.importedAt),
    },
    {
      key: 'source',
      label: m.ui_studio_stat_source(),
      value: <span className="block truncate">{props.route.sourceFileName}</span>,
    },
  );

  return (
    <Card>
      <CardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <StatItem key={stat.key} label={stat.label} value={stat.value} unit={stat.unit} />
        ))}
      </CardGrid>
    </Card>
  );
};
