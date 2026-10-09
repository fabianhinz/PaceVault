import { useCallback, useEffect } from 'react';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { useChartHoverStore } from '@/store/chartHover.ts';

export const DASHBOARD_HOVER_GROUP = 'dashboard';

interface DashboardChartZoom {
  onMouseDown: (e: MouseHandlerDataParam) => void;
  onMouseMove: (e: MouseHandlerDataParam) => void;
  onMouseUp: () => void;
}

const hover = (label: MouseHandlerDataParam['activeLabel']) => {
  if (label == null) {
    return;
  }
  useChartHoverStore.getState().setChartHover(DASHBOARD_HOVER_GROUP, String(label));
};

const clearHover = () => {
  useChartHoverStore.getState().clearChartHover(DASHBOARD_HOVER_GROUP);
};

export const useDashboardChartEvents = (zoom: DashboardChartZoom) => {
  useEffect(() => clearHover, []);

  const zoomMouseMove = zoom.onMouseMove;
  const onMouseMove = useCallback(
    (e: MouseHandlerDataParam) => {
      zoomMouseMove(e);
      hover(e.activeLabel);
    },
    [zoomMouseMove],
  );

  return {
    syncId: DASHBOARD_HOVER_GROUP,
    onMouseDown: zoom.onMouseDown,
    onMouseMove,
    onMouseUp: zoom.onMouseUp,
    onMouseLeave: clearHover,
    onTouchMove: (e: MouseHandlerDataParam) => hover(e.activeLabel),
    onTouchEnd: clearHover,
  };
};
