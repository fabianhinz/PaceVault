import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardGrid } from '@/components/ui/CardGrid.tsx';
import { StatItem } from '@/components/ui/StatItem.tsx';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';
import { rangeToCutoff, customRangeToCutoffs } from '@/lib/timeRange.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import { matchesAttributeFilters } from '@/lib/attributeFilters.ts';
import { m } from '@/paraglide/messages.js';

export const TrainingSummaryCard = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);

  const stats = useMemo(() => {
    let filtered: typeof sessions;

    if (timeRange === 'custom' && customRange) {
      const bounds = customRangeToCutoffs(customRange);
      filtered = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= bounds.from &&
          s.date <= bounds.to &&
          (sportFilter === 'all' || s.sport === sportFilter) &&
          matchesAttributeFilters(s, attributeFilters),
      );
    } else {
      const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, 'custom'>);
      filtered = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= cutoff &&
          (sportFilter === 'all' || s.sport === sportFilter) &&
          matchesAttributeFilters(s, attributeFilters),
      );
    }

    const totalDistance = filtered.reduce((sum, s) => sum + s.distance, 0);
    const totalDuration = filtered.reduce((sum, s) => sum + s.duration, 0);
    const totalElevation = filtered.reduce((sum, s) => sum + (s.elevationGain ?? 0), 0);

    return {
      count: filtered.length,
      distance: totalDistance,
      duration: totalDuration,
      elevation: totalElevation,
    };
  }, [sessions, timeRange, customRange, sportFilter, attributeFilters]);

  return (
    <Card>
      <CardGrid title={m.ui_stat_stats()}>
        <StatItem label={m.ui_stat_sessions()} value={stats.count} />
        <StatItem label={m.ui_stat_total_distance()} value={formatDistance(stats.distance)} />
        <StatItem label={m.ui_stat_total_duration()} value={formatDuration(stats.duration)} />
        {stats.elevation > 0 && (
          <StatItem label={m.ui_stat_total_elevation()} value={`+${stats.elevation}`} unit="m" />
        )}
      </CardGrid>
    </Card>
  );
};
