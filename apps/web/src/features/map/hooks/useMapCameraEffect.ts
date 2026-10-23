import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useMap, type MapRef } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import { densestClusterBounds, unionBounds } from '@pacevault/engine/gps.ts';
import type { GPSBounds, SessionGPS } from '@pacevault/engine/types.ts';
import {
  initialMapCameraState,
  mapCameraFitBlocked,
  nextMapCamera,
  sessionMinZoom,
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
import type { MapPadding } from '../fitPadding.ts';
import type { DetailPath } from '../zoneColoredPath.ts';
import {
  DEM_SETTLE_TIMEOUT_MS,
  ENTRY_PITCH,
  LAP_FIT_DURATION_MS,
  SESSION_FIT_DURATION_MS,
  TILT_DURATION_MS,
  easeTerrainCamera,
  medianElevation,
  terrainFitTarget,
  terrainTiltTarget,
  whenTerrainSettled,
  type TerrainCamera,
} from '../terrainCamera.ts';

const OVERVIEW_FIT_MARGIN = 50;
const OVERVIEW_FIT_DURATION_MS = 1000;
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

interface FitOptions {
  padding: MapPadding;
  duration: number;
  maxZoom?: number;
}

interface CameraRuns {
  token: number;
  cancelEase: (() => void) | null;
  limit: { sessionId: string; off: () => void } | null;
}

interface CameraFit {
  fit: MapCameraFit;
  mapRef: MapRef;
  map: MapLibreMap;
  runs: CameraRuns;
  target: MapCameraTarget;
  median: number | undefined;
  path: [number, number][];
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

const fitOptions = (fit: MapCameraFit): FitOptions => {
  if (fit === 'overview' || fit === 'trip') {
    return { padding: mapPadding(OVERVIEW_FIT_MARGIN), duration: OVERVIEW_FIT_DURATION_MS };
  }
  if (fit === 'lap' || fit === 'lapClose') {
    return {
      padding: mapPadding(MAP_FIT_MARGIN, { sheetCap: LAP_SHEET_CAP }),
      maxZoom: LAP_MAX_ZOOM,
      duration: LAP_FIT_DURATION_MS,
    };
  }
  return { padding: mapPadding(MAP_FIT_MARGIN), duration: SESSION_FIT_DURATION_MS };
};

const boundsArray = (bounds: GPSBounds): LngLatBoundsLike => [
  [bounds.minLng, bounds.minLat],
  [bounds.maxLng, bounds.maxLat],
];

const cancelRunning = (runs: CameraRuns) => {
  runs.token += 1;
  runs.cancelEase?.();
  runs.cancelEase = null;
};

const clearZoomLimit = (map: MapLibreMap, runs: CameraRuns) => {
  if (runs.limit === null) return;
  runs.limit.off();
  runs.limit = null;
  map.setMinZoom(null);
};

const keepsZoomLimit = (target: MapCameraTarget | null, runs: CameraRuns): boolean =>
  target?.kind === 'session' && target.sessionId === runs.limit?.sessionId;

const armZoomLimit = ({
  map,
  runs,
  sessionId,
  bounds,
}: {
  map: MapLibreMap;
  runs: CameraRuns;
  sessionId: string;
  bounds: GPSBounds;
}) => {
  const onMoveEnd = () => {
    const fit = map.cameraForBounds(boundsArray(bounds), {
      padding: mapPadding(MAP_FIT_MARGIN),
      bearing: 0,
    });
    if (fit?.zoom === undefined) return;
    map.setMinZoom(sessionMinZoom({ fitZoom: fit.zoom, currentZoom: map.getZoom() }));
  };
  map.once('moveend', onMoveEnd);
  runs.limit = { sessionId, off: () => map.off('moveend', onMoveEnd) };
};

const runTerrainFit = async ({
  map,
  runs,
  duration,
  camera,
}: {
  map: MapLibreMap;
  runs: CameraRuns;
  duration: number;
  camera: (settled: boolean) => TerrainCamera | null;
}) => {
  cancelRunning(runs);
  const token = runs.token;
  const settled = await whenTerrainSettled({ map, timeout: DEM_SETTLE_TIMEOUT_MS });
  if (token !== runs.token) return;
  const target = camera(settled);
  if (target === null) return;
  runs.cancelEase = easeTerrainCamera({ map, target, duration });
};

const flattenCamera = (map: MapLibreMap, runs: CameraRuns) => {
  cancelRunning(runs);
  map.easeTo({ pitch: 0, bearing: 0, duration: TILT_DURATION_MS });
};

const applyCameraOnlyFit = ({ fit, map, runs, target, median }: CameraFit): boolean => {
  if (fit === 'flatten') {
    clearZoomLimit(map, runs);
    flattenCamera(map, runs);
    return true;
  }
  if (fit !== 'tilt') return false;
  if (target.kind !== 'session' || target.view === '2d') {
    flattenCamera(map, runs);
    return true;
  }
  void runTerrainFit({
    map,
    runs,
    duration: TILT_DURATION_MS,
    camera: (settled) => terrainTiltTarget({ map, pitch: ENTRY_PITCH, median, settled }),
  });
  return true;
};

const applyBoundsFit = ({
  fit,
  mapRef,
  map,
  runs,
  target,
  median,
  path,
  bounds,
}: CameraFit & { bounds: GPSBounds }) => {
  const options = fitOptions(fit);
  if (target.kind === 'session' && target.view === '3d') {
    void runTerrainFit({
      map,
      runs,
      duration: options.duration,
      camera: (settled) =>
        terrainFitTarget({
          map,
          bounds,
          path,
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          padding: options.padding,
          maxZoom: options.maxZoom,
          median,
          settled,
        }),
    });
    return;
  }
  cancelRunning(runs);
  mapRef.fitBounds(boundsArray(bounds), { ...options, pitch: 0, bearing: 0 });
  if (fit === 'session' && target.kind === 'session' && runs.limit === null) {
    armZoomLimit({ map, runs, sessionId: target.sessionId, bounds });
  }
};

const NO_FIT_PATH: [number, number][] = [];

const fitPathOf = ({
  fit,
  lapPath,
  sessionPath,
}: {
  fit: MapCameraFit;
  lapPath: DetailPath | null;
  sessionPath: DetailPath | null;
}): DetailPath | null => {
  if (fit === 'lap' || (fit === 'tilt' && lapPath !== null)) return lapPath;
  return sessionPath;
};

const fitMedian = (path: DetailPath | null): number | undefined => {
  if (path === null) return undefined;
  return medianElevation(path.elevations);
};

const useMapCameraTarget = (): MapCameraTarget => {
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

const useCameraRuns = (map: MapLibreMap | undefined): RefObject<CameraRuns> => {
  const runs = useRef<CameraRuns>({ token: 0, cancelEase: null, limit: null });

  useEffect(() => {
    if (map === undefined) return;
    const current = runs.current;
    const onMoveStart = (event: { originalEvent?: unknown }) => {
      if (event.originalEvent !== undefined) current.token += 1;
    };
    map.on('movestart', onMoveStart);
    return () => {
      map.off('movestart', onMoveStart);
      cancelRunning(current);
      clearZoomLimit(map, current);
    };
  }, [map]);

  return runs;
};

export const useMapCameraEffect = ({
  gpsData,
  tracks,
  lapPath,
  sessionPath,
  mapLoaded,
}: {
  gpsData: SessionGPS[] | null;
  tracks: MapTrack[];
  lapPath: DetailPath | null;
  sessionPath: DetailPath | null;
  mapLoaded: boolean;
}): void => {
  const mapRef = useMap().current;
  const map = mapRef?.getMap();
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
  const runs = useCameraRuns(map);

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
    if (mapRef === undefined || map === undefined) return;
    if (!keepsZoomLimit(target, runs.current)) clearZoomLimit(map, runs.current);
    const pending = state.current.pending;
    if (pending === null || !mapLoaded) return;
    if (mapCameraFitBlocked(pending, observation)) return;
    const fitPath = fitPathOf({ fit: pending, lapPath, sessionPath });
    const fit: CameraFit = {
      fit: pending,
      mapRef,
      map,
      runs: runs.current,
      target,
      median: fitMedian(fitPath),
      path: fitPath?.path ?? NO_FIT_PATH,
    };
    if (applyCameraOnlyFit(fit)) {
      state.current = settleMapCameraFit(state.current);
      return;
    }
    const bounds = fitBoundsOf(pending, {
      tracks,
      gpsData,
      tripSessionIds,
      sessionBounds,
      lapPath: lapPath?.path ?? null,
      studioBounds,
    });
    if (bounds === null) return;
    applyBoundsFit({ ...fit, bounds });
    state.current = settleMapCameraFit(state.current);
  }, [
    mapRef,
    map,
    mapLoaded,
    runs,
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
    sessionPath,
  ]);
};
