import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { toDateString } from '@/lib/formatters.ts';
import { emptyCriteria, matchesFilters } from '@/lib/savedFilters.ts';
import type { DailyMetrics, TrainingSession } from '@/packages/engine/types.ts';

export const useFilteredMetrics = (): {
  history: DailyMetrics[];
  sportTss: Map<string, Record<string, number>>;
  sessions: TrainingSession[];
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);

  return useMemo(() => {
    const now = Date.now();
    const filtered = sessions.filter((s) => {
      if (activeFilter === null) {
        return true;
      }
      if (s.isPlanned) {
        return matchesFilters(s, { ...emptyCriteria(), sport: activeFilter.sport }, now);
      }
      return matchesFilters(s, { ...activeFilter, time: null }, now);
    });
    const history = computeMetrics(filtered);
    const completed = filtered.filter((s) => !s.isPlanned);
    const sportTss = new Map<string, Record<string, number>>();
    for (const s of completed) {
      const dateStr = toDateString(s.date);
      const entry = sportTss.get(dateStr) ?? {};
      entry[s.sport] = (entry[s.sport] ?? 0) + s.tss;
      sportTss.set(dateStr, entry);
    }

    return { history, sportTss, sessions: completed };
  }, [sessions, activeFilter]);
};
