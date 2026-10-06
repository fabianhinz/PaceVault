import { useEffect } from 'react';
import { buildLapSet } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export const useSessionLapsEffect = (records: SessionRecord[], laps: SessionLap[]) => {
  const lapSource = useMapFocusStore((s) => s.lapSource);

  useEffect(() => {
    useMapFocusStore.getState().setSessionLaps(buildLapSet(records, laps, lapSource));
  }, [records, laps, lapSource]);

  useEffect(
    () => () => {
      useMapFocusStore.getState().setSessionLaps(null);
      useMapFocusStore.getState().clearSelectedLap();
      useMapFocusStore.getState().setHoveredLap(null);
    },
    [],
  );
};
