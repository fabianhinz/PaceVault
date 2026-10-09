import { useCallback, useEffect } from 'react';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { categoryHoverHandlers } from '@/lib/chartHover.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';

export const DASHBOARD_HOVER_GROUP = 'dashboard';

interface DashboardChartZoom {
  onMouseDown: (e: MouseHandlerDataParam) => void;
  onMouseMove: (e: MouseHandlerDataParam) => void;
  onMouseUp: () => void;
}

const onHover = (x: string | null) => {
  if (x === null) {
    useChartHoverStore.getState().clearChartHover(DASHBOARD_HOVER_GROUP);
    return;
  }
  useChartHoverStore.getState().setChartHover(DASHBOARD_HOVER_GROUP, x);
};

export const useDashboardChartEvents = (zoom: DashboardChartZoom) => {
  useEffect(() => () => onHover(null), []);

  const zoomMouseMove = zoom.onMouseMove;
  const onMouseMove = useCallback(
    (e: MouseHandlerDataParam) => {
      zoomMouseMove(e);
      if (e.activeLabel != null) onHover(String(e.activeLabel));
    },
    [zoomMouseMove],
  );

  return {
    syncId: DASHBOARD_HOVER_GROUP,
    onMouseDown: zoom.onMouseDown,
    onMouseMove,
    onMouseUp: zoom.onMouseUp,
    ...categoryHoverHandlers(onHover),
  };
};
