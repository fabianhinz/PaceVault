import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';

export const useClearRouteChartHoverEffect = (group: string): void => {
  useEffect(
    () => () => {
      useMapFocusStore.getState().clearHoveredPoint();
      useChartHoverStore.getState().clearChartHover(group);
    },
    [group],
  );
};
