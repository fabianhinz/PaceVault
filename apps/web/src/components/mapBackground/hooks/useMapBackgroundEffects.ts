import type { MapRef } from 'react-map-gl/maplibre';
import { sceneSessionId } from '@/components/mapBackground/mapScene.ts';
import { useWatchPositionEffect } from './useWatchPositionEffect.ts';
import { useGeolocationCameraEffect } from './useGeolocationCameraEffect.ts';
import { useSuppressTapMouseEffect } from './useSuppressTapMouseEffect.ts';
import { useOpenedSessionEffect } from './useOpenedSessionEffect.ts';
import { useMapScene } from './useMapScene.ts';

export const useMapBackgroundEffects = ({
  mapRef,
  mapLoaded,
}: {
  mapRef: React.RefObject<MapRef | null>;
  mapLoaded: boolean;
}): void => {
  useWatchPositionEffect();
  const scene = useMapScene();
  useGeolocationCameraEffect({ mapRef, sessionControls: scene.kind === 'session' });
  useSuppressTapMouseEffect({ mapRef, mapLoaded });
  useOpenedSessionEffect(sceneSessionId(scene));
};
