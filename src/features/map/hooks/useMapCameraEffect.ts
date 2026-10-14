import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { densestClusterBounds, unionBounds } from '@/packages/engine/gps.ts';
import type { GPSBounds, SessionGPS } from '@/packages/engine/types.ts';
import {
  initialMapCameraState,
  mapCameraFitBlocked,
  nextMapCamera,
  settleMapCameraFit,
  type MapCameraFit,
  type MapCameraObservation,
  type MapCameraTarget,
} from '@/lib/mapCamera.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingActive } from '@/features/sessions/hooks/useSessionReprocessingActive.ts';
import type { MapTrack } from './useMapTracks.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import { useSessionFitBounds } from './useSessionFitBounds.ts';
import { pathBounds } from '../lapPath.ts';
import { MAP_FIT_MARGIN, mapPadding } from '../mapPadding.ts';

const OVERVIEW_FIT_MARGIN = 50;
const LAP_MAX_ZOOM = 16;
const LAP_SHEET_CAP = 0.85;

interface FitSources {
  tracks: MapTrack[];
  gpsData: SessionGPS[] | null;
  tripSessionIds: string[];
  sessionBounds: GPSBounds | null;
  lapPath: [number, number][] | null;
  studioBounds: GPSBounds | null;
}

const tripBounds = (sources: FitSources): GPSBounds | null => {
  if (sources.gpsData === null) return null;
  const tripIds = new Set(sources.tripSessionIds);
  return unionBounds(
    sources.gpsData.filter((gps) => tripIds.has(gps.sessionId)).map((gps) => gps.bounds),
  );
};

const fitBoundsOf = (fit: MapCameraFit, sources: FitSources): GPSBounds | null => {
  if (fit === 'overview') return densestClusterBounds(sources.tracks.map((t) => t.gps.bounds));
  if (fit === 'trip') return tripBounds(sources);
  if (fit === 'lap') {
    if (sources.lapPath === null) return null;
    return pathBounds(sources.lapPath);
  }
  if (fit === 'studio') return sources.studioBounds;
  return sources.sessionBounds;
};

const fitOptions = (fit: MapCameraFit) => {
  if (fit === 'overview' || fit === 'trip') {
    return { padding: mapPadding(OVERVIEW_FIT_MARGIN), duration: 1000 };
  }
  if (fit === 'lap' || fit === 'lapClose') {
    return {
      padding: mapPadding(MAP_FIT_MARGIN, { sheetCap: LAP_SHEET_CAP }),
      maxZoom: LAP_MAX_ZOOM,
      duration: 800,
    };
  }
  return { padding: mapPadding(MAP_FIT_MARGIN), duration: 1200 };
};

const useMapCameraTarget = (): MapCameraTarget => {
  const studio = useStudioMapTracks();
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const selectedLapIndex = useMapControlsStore((s) => s.selectedLapIndex);
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
      return { kind: 'session', sessionId: openedSessionId, lapIndex: selectedLapIndex };
    }
    if (tripKey !== '') return { kind: 'trip', tripKey };
    return { kind: 'overview' };
  }, [studio.active, studio.routeId, openedSessionId, selectedLapIndex, tripKey]);
};

export const useMapCameraEffect = (
  gpsData: SessionGPS[] | null,
  tracks: MapTrack[],
  lapPath: [number, number][] | null,
  mapLoaded: boolean,
) => {
  const map = useMap().current;
  const target = useMapCameraTarget();
  const studioBounds = useStudioMapTracks().bounds;
  const tripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const lapCloseCount = useMapControlsStore((s) => s.lapCloseCount);
  const refitRequest = useMapFocusStore((s) => s.mapRefitRequest);
  const filter = useFiltersStore((s) => s.activeFilter);
  const sessionDataBlocked = useSessionReprocessingActive();
  const progressOverlayOpen = useImportProgressStore(
    (s) => s.foreground !== null || s.awaitingTrackBuild,
  );
  const sessionBounds = useSessionFitBounds(gpsData, openedSessionId);
  const visibleKey = useMemo(() => tracks.map((t) => t.sessionId).join(','), [tracks]);
  const state = useRef(initialMapCameraState);

  useEffect(() => {
    const observation: MapCameraObservation = {
      target,
      visibleKey,
      visibleCount: tracks.length,
      filter,
      lapCloseCount,
      refitRequest,
      studioHasBounds: studioBounds !== null,
      sessionDataBlocked,
      progressOverlayOpen,
    };
    state.current = nextMapCamera(state.current, observation);
    const pending = state.current.pending;
    if (pending === null || !map || !mapLoaded) return;
    if (mapCameraFitBlocked(pending, observation)) return;
    const bounds = fitBoundsOf(pending, {
      tracks,
      gpsData,
      tripSessionIds,
      sessionBounds,
      lapPath,
      studioBounds,
    });
    if (bounds === null) return;
    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      fitOptions(pending),
    );
    state.current = settleMapCameraFit(state.current);
  }, [
    map,
    mapLoaded,
    target,
    visibleKey,
    tracks,
    filter,
    lapCloseCount,
    refitRequest,
    studioBounds,
    sessionDataBlocked,
    progressOverlayOpen,
    gpsData,
    tripSessionIds,
    sessionBounds,
    lapPath,
  ]);
};
