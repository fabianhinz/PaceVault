import { useMemo } from 'react';
import type { MapCameraTarget } from '@/components/mapBackground/mapCamera.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';

export const useMapCameraTarget = (): MapCameraTarget => {
  const studio = useStudioMapTracks();
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const selectedLapIndex = useMapControlsStore((s) => s.selectedLapIndex);
  const sessionMapView = useMapControlsStore((s) => s.sessionMapView);
  const focusedTripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);
  const tripKey = useMemo(
    () => [...focusedTripSessionIds].sort().join(','),
    [focusedTripSessionIds],
  );

  return useMemo((): MapCameraTarget => {
    if (studio.active) {
      if (studio.routeId !== null) return { kind: 'studioRoute', routeId: studio.routeId };
      return { kind: 'studioTab' };
    }
    if (openedSessionId !== null) {
      return {
        kind: 'session',
        sessionId: openedSessionId,
        lapIndex: selectedLapIndex,
        view: sessionMapView,
      };
    }
    if (tripKey !== '') return { kind: 'trip', tripKey };
    return { kind: 'overview' };
  }, [studio.active, studio.routeId, openedSessionId, selectedLapIndex, sessionMapView, tripKey]);
};
