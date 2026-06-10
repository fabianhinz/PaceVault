import { useState, useEffect } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { getSessionGPS } from '@/lib/indexeddb.ts';
import { rangeToCutoff, customRangeToCutoffs } from '@/lib/timeRange.ts';
import { matchesAttributeFilters } from '@/lib/attributeFilters.ts';
import type { SessionGPS, Sport, TrainingSession } from '@/packages/engine/types.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}

export const useMapTracks = (gpsData: SessionGPS[] | null) => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);

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

      const filtered = sessions.filter((s) => {
        if (sportFilter !== 'all' && s.sport !== sportFilter) return false;
        if (!matchesAttributeFilters(s, attributeFilters)) return false;
        if (timeRange === 'custom' && customRange) {
          const cutoffs = customRangeToCutoffs(customRange);
          return s.date >= cutoffs.from && s.date <= cutoffs.to;
        }
        if (timeRange !== 'custom') {
          const cutoff = rangeToCutoff(timeRange);
          return s.date >= cutoff;
        }
        return true;
      });

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
  }, [sessions, timeRange, customRange, sportFilter, attributeFilters, gpsData, openedSessionId]);

  return { tracks, loading };
};
