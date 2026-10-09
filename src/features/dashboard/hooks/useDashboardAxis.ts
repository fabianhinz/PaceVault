import { useMemo } from 'react';
import { useFilteredMetrics } from './useFilteredMetrics.ts';
import { useDashboardChartZoom } from './useDashboardChartZoom.ts';

export const useDashboardAxis = () => {
  const metrics = useFilteredMetrics();
  const zoom = useDashboardChartZoom();
  const days = zoom.days;

  const history = useMemo(() => {
    if (days === null) {
      return metrics.history;
    }
    return metrics.history.filter((d) => d.date >= days.from && d.date <= days.to);
  }, [metrics.history, days]);

  return {
    history,
    sportTss: metrics.sportTss,
    sessions: metrics.sessions,
    days,
    onZoomComplete: zoom.onZoomComplete,
  };
};

export type DashboardAxis = ReturnType<typeof useDashboardAxis>;
