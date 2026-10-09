import { useState, useEffect } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { getSessionGPS } from '@/lib/indexeddb.ts';
import { matchesFilters } from '@/lib/savedFilters.ts';
import type { SessionGPS, Sport, TrainingSession } from '@/packages/engine/types.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}

export const useMapTracks = (gpsData: SessionGPS[] | null) => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const focusedTripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);

  const [tracks, setTracks] = useState<MapTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      if (openedSessionId) {
        const session = sessions.find((s) => s.id === openedSessionId);
        const gps = await getSessionGPS(openedSessionId);
        if (cancelled) return;

        if (gps && session) {
          setTracks([{ sessionId: openedSessionId, sport: session.sport, gps, session }]);
        } else {
          setTracks([]);
        }
        setLoading(false);
        return;
      }

      if (!gpsData) return;

      const gpsMap = new Map<string, SessionGPS>();
      for (const g of gpsData) {
        gpsMap.set(g.sessionId, g);
      }

      if (focusedTripSessionIds.length > 0) {
        const tripIds = new Set(focusedTripSessionIds);
        const result: MapTrack[] = [];
        for (const s of sessions) {
          if (!tripIds.has(s.id)) continue;
          const gps = gpsMap.get(s.id);
          if (gps) result.push({ sessionId: s.id, sport: s.sport, gps, session: s });
        }
        if (!cancelled) {
          setTracks(result);
          setLoading(false);
        }
        return;
      }

      const now = Date.now();
      const filtered = sessions.filter((s) => matchesFilters(s, activeFilter, now));

      const result: MapTrack[] = [];
      for (const s of filtered) {
        const gps = gpsMap.get(s.id);
        if (gps) result.push({ sessionId: s.id, sport: s.sport, gps, session: s });
      }

      if (!cancelled) {
        setTracks(result);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sessions, activeFilter, gpsData, openedSessionId, focusedTripSessionIds]);

  return { tracks, loading };
};
