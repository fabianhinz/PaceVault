import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { matchesFilters } from '@/lib/savedFilters.ts';
import type { SessionGPS, Sport, TrainingSession } from '@/packages/engine/types.ts';
import { useSessionReprocessingActive } from '@/features/sessions/hooks/useSessionReprocessingActive.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}

const NO_TRACKS: MapTrack[] = [];

export const useMapTracks = (gpsData: SessionGPS[] | null): MapTrack[] => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const focusedTripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);
  const reprocessing = useSessionReprocessingActive();
  const studioActive = useStudioMapTracks().active;
  const tripActive = focusedTripSessionIds.length > 0;
  let filter = activeFilter;
  if (tripActive) filter = null;

  return useMemo(() => {
    if (studioActive || reprocessing || openedSessionId !== null || gpsData === null) {
      return NO_TRACKS;
    }

    const gpsMap = new Map<string, SessionGPS>();
    for (const g of gpsData) {
      gpsMap.set(g.sessionId, g);
    }

    let visible: TrainingSession[];
    if (tripActive) {
      const tripIds = new Set(focusedTripSessionIds);
      visible = sessions.filter((s) => tripIds.has(s.id));
    } else {
      const now = Date.now();
      visible = sessions.filter((s) => matchesFilters(s, filter, now));
    }

    const result: MapTrack[] = [];
    for (const s of visible) {
      const gps = gpsMap.get(s.id);
      if (gps) result.push({ sessionId: s.id, sport: s.sport, gps, session: s });
    }
    return result;
  }, [
    studioActive,
    reprocessing,
    openedSessionId,
    gpsData,
    tripActive,
    focusedTripSessionIds,
    sessions,
    filter,
  ]);
};
