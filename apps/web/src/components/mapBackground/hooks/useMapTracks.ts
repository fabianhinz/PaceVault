import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { matchesFilters } from '@/lib/filtering/filters.ts';
import type { SessionGPS, TrainingSession } from '@pacevault/engine/types.ts';
import { useSessionReprocessingActive } from '@/store/hooks/useSessionReprocessingActive.ts';
import { sceneTripSessionIds, type MapSceneKind } from '@/components/mapBackground/mapScene.ts';
import { useMapScene } from './useMapScene.ts';
import type { MapTrack } from './types.ts';

const NO_TRACKS: MapTrack[] = [];

const TRACKS_LISTED_BY_SCENE_KIND: Record<MapSceneKind, boolean> = {
  overview: true,
  trip: true,
  session: false,
  segmentTab: true,
  segmentPage: true,
  studioTab: false,
  studioRoute: false,
};

export const useMapTracks = (gpsData: SessionGPS[] | null): MapTrack[] => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const scene = useMapScene();
  const reprocessing = useSessionReprocessingActive();
  const listed = TRACKS_LISTED_BY_SCENE_KIND[scene.kind];
  const tripActive = scene.kind === 'trip';
  const tripSessionIds = sceneTripSessionIds(scene);
  let filter = activeFilter;
  if (tripActive) filter = null;

  return useMemo(() => {
    if (!listed || reprocessing || gpsData === null) {
      return NO_TRACKS;
    }

    const gpsMap = new Map<string, SessionGPS>();
    for (const g of gpsData) {
      gpsMap.set(g.sessionId, g);
    }

    let visible: TrainingSession[];
    if (tripActive) {
      const tripIds = new Set(tripSessionIds);
      visible = sessions.filter((s) => tripIds.has(s.id));
    } else {
      const now = Date.now();
      visible = sessions.filter((s) => matchesFilters({ session: s, criteria: filter, now }));
    }

    const result: MapTrack[] = [];
    for (const s of visible) {
      const gps = gpsMap.get(s.id);
      if (gps) result.push({ sessionId: s.id, sport: s.sport, gps, session: s });
    }
    return result;
  }, [listed, reprocessing, gpsData, tripActive, tripSessionIds, sessions, filter]);
};
