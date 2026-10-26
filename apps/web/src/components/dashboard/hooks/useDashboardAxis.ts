import { useMemo } from 'react';
import type { DailyMetrics, TrainingSession } from '@pacevault/engine/types.ts';
import { useFilteredMetrics, type FilteredMetrics } from './useFilteredMetrics.ts';
import { useDashboardChartZoom, type DashboardZoomRange } from './useDashboardChartZoom.ts';

export interface DashboardAxis {
  history: DailyMetrics[];
  sportTss: FilteredMetrics['sportTss'];
  sessions: TrainingSession[];
  days: DashboardZoomRange['days'];
  onZoomComplete: DashboardZoomRange['onZoomComplete'];
}

export const useDashboardAxis = (): DashboardAxis => {
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
