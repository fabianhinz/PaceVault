import { useCallback, useMemo } from 'react';
import { useFiltersStore } from '@/store/filters.ts';
import { resolveFilterRange } from '@/lib/filtering/timeRange.ts';
import { toDateString } from '@/lib/format/formatters.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

export interface DashboardZoomRange {
  days: { from: string; to: string; count: number } | null;
  onZoomComplete: (from: string | number, to: string | number) => void;
}

export const useDashboardChartZoom = (): DashboardZoomRange => {
  const time = useFiltersStore((s) => s.activeFilter?.time ?? null);

  const days = useMemo(() => {
    const range = resolveFilterRange({ time, now: Date.now() });
    if (range === null) {
      return null;
    }
    return {
      from: toDateString(range.from),
      to: toDateString(range.to),
      count: Math.round((range.to - range.from) / MS_PER_DAY),
    };
  }, [time]);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    useFiltersStore.getState().setDashboardChartRange({ from: String(from), to: String(to) });
  }, []);

  return { days, onZoomComplete };
};
