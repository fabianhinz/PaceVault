import { useDeferredValue, useEffect, useMemo } from 'react';
import { recordedDistance, buildLapSet, effectiveSplitDistance } from '@/lib/laps.ts';
import { useThresholdsAt } from '@/features/settings/hooks/useThresholdsAt.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { SessionLap, SessionRecord } from '@pacevault/engine/types.ts';

export const useSessionLapsEffect = ({
  records,
  laps,
}: {
  records: SessionRecord[];
  laps: SessionLap[];
}): void => {
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const sport = useSessionsStore(
    (s) => s.sessions.find((session) => session.id === openedSessionId)?.sport,
  );
  const date = useSessionsStore(
    (s) => s.sessions.find((session) => session.id === openedSessionId)?.date,
  );
  const thresholds = useThresholdsAt(date ?? 0);
  const sportPreferences = useDeferredValue(
    useMapPreferencesStore((s) => {
      if (sport === undefined) return undefined;
      return s.bySport[sport];
    }),
  );

  const sessionMetres = useMemo(() => recordedDistance(records), [records]);

  const lapSet = useMemo(() => {
    if (sport === undefined || sportPreferences === undefined) return null;
    const metres = effectiveSplitDistance({
      splitDistance: sportPreferences.splitDistance,
      sport,
      sessionMetres,
    });
    return buildLapSet({
      records,
      laps,
      source: sportPreferences.lapSource,
      splitDistance: metres,
      effortContext: { sport, thresholds },
    });
  }, [records, laps, sportPreferences, sport, sessionMetres, thresholds]);

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
