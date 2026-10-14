import { useDeferredValue, useEffect, useMemo } from 'react';
import { recordedDistance } from '@/lib/dynamicLaps.ts';
import { buildLapSet, effectiveSplitDistance } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export const useSessionLapsEffect = (records: SessionRecord[], laps: SessionLap[]) => {
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const sport = useSessionsStore(
    (s) => s.sessions.find((session) => session.id === openedSessionId)?.sport,
  );
  const sportPreferences = useDeferredValue(
    useMapPreferencesStore((s) => {
      if (sport === undefined) return undefined;
      return s.bySport[sport];
    }),
  );

  const sessionMetres = useMemo(() => recordedDistance(records), [records]);

  const lapSet = useMemo(() => {
    if (sport === undefined || sportPreferences === undefined) return null;
    const metres = effectiveSplitDistance(sportPreferences.splitDistance, sport, sessionMetres);
    return buildLapSet(records, laps, sportPreferences.lapSource, metres);
  }, [records, laps, sportPreferences, sport, sessionMetres]);

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
