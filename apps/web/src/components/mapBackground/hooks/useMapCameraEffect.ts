import { useEffect, useRef } from 'react';
import { useMap, type MapRef } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import { densestClusterBounds, unionBounds } from '@pacevault/engine/bounds.ts';
import type { GPSBounds, SessionGPS } from '@pacevault/engine/types.ts';
import {
  initialMapCameraState,
  isMapCameraFitBlocked,
  nextMapCamera,
  sessionMinZoom,
  settleMapCameraFit,
  type MapCameraFit,
  type MapCameraObservation,
  type MapCameraTarget,
} from '@/components/mapBackground/mapCamera.ts';
import type { MapTrack } from './types.ts';
import { useCameraRuns } from './useCameraRuns.ts';
import { useMapCameraInputs } from './useMapCameraInputs.ts';
import { cancelRunning, clearZoomLimit, type CameraRuns } from './cameraRuns.ts';
import { pathBounds } from '@/components/mapBackground/lapPath.ts';
import { MAP_FIT_MARGIN, mapPadding } from '@/components/mapBackground/mapPadding.ts';
import type { MapPadding } from '@/components/mapBackground/fitPadding.ts';
import type { DetailPath } from '@/components/mapBackground/zoneColoredPath.ts';
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
} from '@/components/mapBackground/terrainCamera.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

const OVERVIEW_FIT_MARGIN = 50;
const OVERVIEW_FIT_DURATION_MS = MS_PER_SECOND;
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

const fitBoundsOf = ({
  fit,
  sources,
}: {
  fit: MapCameraFit;
  sources: FitSources;
}): GPSBounds | null => {
  switch (fit) {
    case 'overview':
      return densestClusterBounds(sources.tracks.map((t) => t.gps.bounds));
    case 'trip':
      return tripBounds(sources);
    case 'lap':
      if (sources.lapPath === null) return null;
      return pathBounds(sources.lapPath);
    case 'studio':
      return sources.studioBounds;
    case 'session':
    case 'lapClose':
    case 'tilt':
    case 'flatten':
      return sources.sessionBounds;
  }
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

const isZoomLimitKept = ({
  target,
  runs,
}: {
  target: MapCameraTarget | null;
  runs: CameraRuns;
}): boolean => target?.kind === 'session' && target.sessionId === runs.limit?.sessionId;

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
  void map.once('moveend', onMoveEnd);
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

const flattenCamera = ({ map, runs }: { map: MapLibreMap; runs: CameraRuns }) => {
  cancelRunning(runs);
  map.easeTo({ pitch: 0, bearing: 0, duration: TILT_DURATION_MS });
};

const applyCameraOnlyFit = ({ fit, map, runs, target, median }: CameraFit): boolean => {
  switch (fit) {
    case 'flatten':
      clearZoomLimit({ map, runs });
      flattenCamera({ map, runs });
      return true;
    case 'tilt':
      if (target.kind !== 'session' || target.view === '2d') {
        flattenCamera({ map, runs });
        return true;
      }
      void runTerrainFit({
        map,
        runs,
        duration: TILT_DURATION_MS,
        camera: (settled) => terrainTiltTarget({ map, pitch: ENTRY_PITCH, median, settled }),
      });
      return true;
    case 'overview':
    case 'session':
    case 'lap':
    case 'lapClose':
    case 'trip':
    case 'studio':
      return false;
  }
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
  switch (fit) {
    case 'lap':
      return lapPath;
    case 'tilt':
      if (lapPath !== null) return lapPath;
      return sessionPath;
    case 'overview':
    case 'session':
    case 'lapClose':
    case 'flatten':
    case 'trip':
    case 'studio':
      return sessionPath;
  }
};

const fitMedian = (path: DetailPath | null): number | undefined => {
  if (path === null) return undefined;
  return medianElevation(path.elevations);
};

const runPendingFit = ({
  pending,
  mapRef,
  map,
  runs,
  target,
  lapPath,
  sessionPath,
  sources,
}: {
  pending: MapCameraFit;
  mapRef: MapRef;
  map: MapLibreMap;
  runs: CameraRuns;
  target: MapCameraTarget;
  lapPath: DetailPath | null;
  sessionPath: DetailPath | null;
  sources: FitSources;
}): boolean => {
  const fitPath = fitPathOf({ fit: pending, lapPath, sessionPath });
  const fit: CameraFit = {
    fit: pending,
    mapRef,
    map,
    runs,
    target,
    median: fitMedian(fitPath),
    path: fitPath?.path ?? NO_FIT_PATH,
  };
  if (applyCameraOnlyFit(fit)) {
    return true;
  }
  const bounds = fitBoundsOf({ fit: pending, sources });
  if (bounds === null) return false;
  applyBoundsFit({ ...fit, bounds });
  return true;
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
  const inputs = useMapCameraInputs({ gpsData, tracks });
  const state = useRef(initialMapCameraState);
  const runs = useCameraRuns(map);

  useEffect(() => {
    const observation: MapCameraObservation = {
      target: inputs.target,
      visibleKey: inputs.visibleKey,
      visibleCount: tracks.length,
      filter: inputs.filter,
      lapCloseCount: inputs.lapCloseCount,
      refitRequest: inputs.refitRequest,
      studioHasBounds: inputs.studioBounds !== null,
      sessionDataBlocked: inputs.sessionDataBlocked,
      progressOverlayOpen: inputs.progressOverlayOpen,
    };
    state.current = nextMapCamera({ state: state.current, obs: observation });
    if (mapRef === undefined || map === undefined) return;
    if (!isZoomLimitKept({ target: inputs.target, runs: runs.current }))
      clearZoomLimit({ map, runs: runs.current });
    const pending = state.current.pending;
    if (pending === null || !mapLoaded) return;
    if (isMapCameraFitBlocked({ fit: pending, obs: observation })) return;
    if (
      !runPendingFit({
        pending,
        mapRef,
        map,
        runs: runs.current,
        target: inputs.target,
        lapPath,
        sessionPath,
        sources: {
          tracks,
          gpsData,
          tripSessionIds: inputs.tripSessionIds,
          sessionBounds: inputs.sessionBounds,
          lapPath: lapPath?.path ?? null,
          studioBounds: inputs.studioBounds,
        },
      })
    )
      return;
    state.current = settleMapCameraFit(state.current);
  }, [
    mapRef,
    map,
    mapLoaded,
    runs,
    inputs.target,
    inputs.visibleKey,
    tracks,
    inputs.filter,
    inputs.lapCloseCount,
    inputs.refitRequest,
    inputs.studioBounds,
    inputs.sessionDataBlocked,
    inputs.progressOverlayOpen,
    gpsData,
    inputs.tripSessionIds,
    inputs.sessionBounds,
    lapPath,
    sessionPath,
  ]);
};
