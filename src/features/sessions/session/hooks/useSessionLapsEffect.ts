import { useEffect, useMemo } from 'react';
import { recordedDistance } from '@/lib/dynamicLaps.ts';
import { buildLapSet, effectiveSplitDistance } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export const useSessionLapsEffect = (records: SessionRecord[], laps: SessionLap[]) => {
  const lapSource = useMapFocusStore((s) => s.lapSource);
  const splitDistance = useMapFocusStore((s) => s.splitDistance);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const sport = useSessionsStore(
    (s) => s.sessions.find((session) => session.id === openedSessionId)?.sport,
  );

  const sessionMetres = useMemo(() => recordedDistance(records), [records]);

  useEffect(() => {
    if (sport === undefined) {
      useMapFocusStore.getState().setSessionLaps(null);
      return;
    }
    const metres = effectiveSplitDistance(splitDistance, sport, sessionMetres);
    useMapFocusStore.getState().setSessionLaps(buildLapSet(records, laps, lapSource, metres));
  }, [records, laps, lapSource, splitDistance, sport, sessionMetres]);

  useEffect(
    () => () => {
      useMapFocusStore.getState().setSessionLaps(null);
      useMapFocusStore.getState().clearSelectedLap();
      useMapFocusStore.getState().setHoveredLap(null);
    },
    [],
  );
};
