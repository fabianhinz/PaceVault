import { useCallback } from 'react';
import { useClearRouteChartHoverEffect } from '@/components/studio/hooks/useClearRouteChartHoverEffect.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';
import { HOVER_GROUP } from '@/components/studio/types.ts';

export const useRouteChartHover = (
  gpsLookup: Map<number, [number, number]>,
): ((dist: number | null) => void) => {
  const onHover = useCallback(
    (dist: number | null) => {
      if (dist == null) {
        useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
        useMapFocusStore.getState().clearHoveredPoint();
        return;
      }
      useChartHoverStore.getState().setChartHover({ group: HOVER_GROUP, x: dist });
      const point = gpsLookup.get(dist);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsLookup],
  );

  useClearRouteChartHoverEffect(HOVER_GROUP);

  return onHover;
};
