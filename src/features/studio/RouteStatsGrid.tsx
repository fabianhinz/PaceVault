import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatTile } from '@/components/ui/StatTile.tsx';
import { formatDate, formatDistance } from '@/lib/formatters.ts';
import type { StudioRoute } from '@/store/studio.ts';

export const RouteStatsGrid = (props: { route: StudioRoute }) => {
  const stats: Array<{ key: string; title: string; value: string; unit?: string }> = [
    {
      key: 'distance',
      title: m.ui_studio_stat_distance(),
      value: formatDistance(props.route.distance),
    },
  ];

  stats.push(
    {
      key: 'imported',
      title: m.ui_studio_stat_imported(),
      value: formatDate(props.route.importedAt),
    },
    {
      key: 'source',
      title: m.ui_studio_stat_source(),
      value: props.route.sourceFileName,
    },
  );

  return (
    <Card>
      <CardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <StatTile key={stat.key} title={stat.title} value={stat.value} unit={stat.unit} />
        ))}
      </CardGrid>
    </Card>
  );
};
