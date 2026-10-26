import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';

export const useClearSessionChartHoverEffect = (group: string): void => {
  useEffect(
    () => () => {
      useMapFocusStore.getState().clearHoveredPoint();
      useMapControlsStore.getState().setHoveredLap(null);
      useChartHoverStore.getState().clearChartHover(group);
    },
    [group],
  );
};
