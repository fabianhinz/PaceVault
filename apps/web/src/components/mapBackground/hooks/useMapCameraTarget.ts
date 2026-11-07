import { useMemo } from 'react';
import type { MapCameraTarget } from '@/components/mapBackground/mapCamera.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { sceneTripSessionIds } from '@/components/mapBackground/mapScene.ts';
import { useMapScene } from './useMapScene.ts';

export const useMapCameraTarget = (): MapCameraTarget => {
  const scene = useMapScene();
  const selectedLapIndex = useMapControlsStore((s) => s.selectedLapIndex);
  const sessionMapView = useMapControlsStore((s) => s.sessionMapView);
  const tripSessionIds = sceneTripSessionIds(scene);
  const tripKey = useMemo(() => [...tripSessionIds].sort().join(','), [tripSessionIds]);

  return useMemo((): MapCameraTarget => {
    switch (scene.kind) {
      case 'studioRoute':
        return { kind: 'studioRoute', routeId: scene.routeId };
      case 'studioTab':
        return { kind: 'studioTab' };
      case 'segmentPage':
        return { kind: 'segment', segmentId: scene.segmentId };
      case 'session':
        return {
          kind: 'session',
          sessionId: scene.sessionId,
          lapIndex: selectedLapIndex,
          view: sessionMapView,
        };
      case 'trip':
        return { kind: 'trip', tripKey };
      case 'overview':
      case 'segmentTab':
        return { kind: 'overview' };
    }
  }, [scene, selectedLapIndex, sessionMapView, tripKey]);
};
