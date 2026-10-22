import { useCallback, useMemo } from 'react';
import { useFiltersStore } from '@/store/filters.ts';
import { resolveFilterRange } from '@/lib/timeRange.ts';
import { toDateString } from '@/lib/formatters.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

export const useDashboardChartZoom = () => {
  const time = useFiltersStore((s) => s.activeFilter?.time ?? null);

  const days = useMemo(() => {
    const range = resolveFilterRange(time, Date.now());
    if (range === null) {
      return null;
    }
    return {
      from: toDateString(range.from),
      to: toDateString(range.to),
      count: Math.round((range.to - range.from) / DAY_MS),
    };
  }, [time]);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    useFiltersStore.getState().setDashboardChartRange(String(from), String(to));
  }, []);

  return { days, onZoomComplete };
};
