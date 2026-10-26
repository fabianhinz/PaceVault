import { useEffect, useRef, type RefObject } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cancelRunning, clearZoomLimit, type CameraRuns } from './cameraRuns.ts';

export const useCameraRuns = (map: MapLibreMap | undefined): RefObject<CameraRuns> => {
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
      clearZoomLimit({ map, runs: current });
    };
  }, [map]);

  return runs;
};
