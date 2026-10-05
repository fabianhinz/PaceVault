import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import { formatDate, formatDistance } from '@/lib/formatters.ts';
import type { StudioRoute } from '@/store/studio.ts';

export const RouteStatsGrid = (props: { route: StudioRoute }) => {
  const stats: Array<{ key: string; label: string; value: ReactNode; unit?: string }> = [
    {
      key: 'distance',
      label: m.ui_studio_stat_distance(),
      value: formatDistance(props.route.distance),
    },
  ];

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
