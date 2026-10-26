import { useCallback } from 'react';
import { useClearSessionChartHoverEffect } from '@/features/sessions/hooks/useClearSessionChartHoverEffect.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useChartHoverStore } from '@/store/chartHover.ts';
import { lapIndexAtTime } from '@/lib/laps.ts';
import { HOVER_GROUP } from '@/features/sessions/charts/types.ts';

interface SessionChartHover {
  onHover: (time: number | null) => void;
  onSelectTime: (time: number) => void;
}

const currentLapBands = () => useMapControlsStore.getState().sessionLaps?.bands ?? [];

export const useSessionChartHover = (
  gpsLookup: Map<number, [number, number]>,
): SessionChartHover => {
  const onHover = useCallback(
    (time: number | null) => {
      if (time == null) {
        useChartHoverStore.getState().clearChartHover(HOVER_GROUP);
        useMapFocusStore.getState().clearHoveredPoint();
        useMapControlsStore.getState().setHoveredLap(null);
        return;
      }
      useChartHoverStore.getState().setChartHover({ group: HOVER_GROUP, x: time });
      useMapControlsStore
        .getState()
        .setHoveredLap(lapIndexAtTime({ bands: currentLapBands(), minutes: time }) ?? null);
      const point = gpsLookup.get(time);
      if (point) {
        useMapFocusStore.getState().setHoveredPoint(point);
      }
    },
    [gpsLookup],
  );

  const onSelectTime = useCallback((time: number) => {
    const lapIndex = lapIndexAtTime({ bands: currentLapBands(), minutes: time });
    if (lapIndex === undefined) return;
    useMapControlsStore.getState().toggleSelectedLap(lapIndex);
  }, []);

  useClearSessionChartHoverEffect(HOVER_GROUP);

  return { onHover, onSelectTime };
};
