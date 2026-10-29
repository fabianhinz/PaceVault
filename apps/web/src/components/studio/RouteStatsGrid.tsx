import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardGrid } from '@pacevault/ui/components/pvCardGrid/PvCardGrid.tsx';
import { PvStatTile } from '@pacevault/ui/components/pvStatTile/PvStatTile.tsx';
import { formatDate, formatDistance } from '@/lib/format/formatters.ts';
import type { StudioRoute } from '@/types.ts';

interface RouteStatsGridProps {
  route: StudioRoute;
}

export const RouteStatsGrid: FC<RouteStatsGridProps> = (props) => {
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
    <PvCard>
      <PvCardGrid title={m.ui_stat_stats()} collapsedRows={1}>
        {stats.map((stat) => (
          <PvStatTile key={stat.key} title={stat.title} value={stat.value} unit={stat.unit} />
        ))}
      </PvCardGrid>
    </PvCard>
  );
};
