import { useCallback } from 'react';
import { useFiltersStore } from '@/store/filters.ts';

export const useDashboardChartZoom = () => {
  const range = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    useFiltersStore.getState().setDashboardChartRange(String(from), String(to));
  }, []);

  return { range, customRange, onZoomComplete };
};
