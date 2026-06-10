import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { toDateString } from '@/lib/formatters.ts';
import { isAttributeFilterActive, matchesAttributeFilters } from '@/lib/attributeFilters.ts';
import type { DailyMetrics } from '@/packages/engine/types.ts';

export const useFilteredMetrics = (): {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
  sportTss: Map<string, Record<string, number>>;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);

  return useMemo(() => {
    let filtered = sessions;
    if (sportFilter !== 'all') {
      filtered = sessions.filter((s) => s.sport === sportFilter);
    }
    if (isAttributeFilterActive(attributeFilters)) {
      // Planned sessions feed load projections — exempt them from attribute filtering
      filtered = filtered.filter(
        (s) => s.isPlanned || matchesAttributeFilters(s, attributeFilters),
      );
    }
    const history = computeMetrics(filtered);
    let current: DailyMetrics | undefined = undefined;
    if (history.length > 0) {
      current = history[history.length - 1];
    }

    const sportTss = new Map<string, Record<string, number>>();
    for (const s of filtered) {
      if (s.isPlanned) continue;
      const dateStr = toDateString(s.date);
      const entry = sportTss.get(dateStr) ?? {};
      entry[s.sport] = (entry[s.sport] ?? 0) + s.tss;
      sportTss.set(dateStr, entry);
    }

    return { history, current, sportTss };
  }, [sessions, sportFilter, attributeFilters]);
};
