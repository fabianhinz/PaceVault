import { useDeferredValue, useEffect, useMemo } from 'react';
import { recordedDistance } from '@/lib/dynamicLaps.ts';
import { buildLapSet, effectiveSplitDistance } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export const useSessionLapsEffect = (records: SessionRecord[], laps: SessionLap[]) => {
  const lapSource = useDeferredValue(useMapControlsStore((s) => s.lapSource));
  const splitDistance = useDeferredValue(useMapControlsStore((s) => s.splitDistance));
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const sport = useSessionsStore(
    (s) => s.sessions.find((session) => session.id === openedSessionId)?.sport,
  );

  const sessionMetres = useMemo(() => recordedDistance(records), [records]);

  const lapSet = useMemo(() => {
    if (sport === undefined) return null;
    const metres = effectiveSplitDistance(splitDistance, sport, sessionMetres);
    return buildLapSet(records, laps, lapSource, metres);
  }, [records, laps, lapSource, splitDistance, sport, sessionMetres]);

  useEffect(() => {
    useMapControlsStore.getState().setSessionLaps(lapSet);
  }, [lapSet]);

  useEffect(
    () => () => {
      useMapControlsStore.getState().setSessionLaps(null);
      useMapControlsStore.getState().clearSelectedLap();
      useMapControlsStore.getState().setHoveredLap(null);
    },
    [],
  );
};
