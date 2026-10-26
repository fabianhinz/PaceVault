import type { MapRef } from 'react-map-gl/maplibre';
import { useRouteMatch } from '@/routing/useRouteMatch.ts';
import { useWatchPositionEffect } from './useWatchPositionEffect.ts';
import { useGeolocationCameraEffect } from './useGeolocationCameraEffect.ts';
import { useSuppressTapMouseEffect } from './useSuppressTapMouseEffect.ts';
import { useOpenedSessionEffect } from './useOpenedSessionEffect.ts';

export const useMapBackgroundEffects = ({
  mapRef,
  mapLoaded,
}: {
  mapRef: React.RefObject<MapRef | null>;
  mapLoaded: boolean;
}): void => {
  useWatchPositionEffect();
  useGeolocationCameraEffect(mapRef);
  useSuppressTapMouseEffect({ mapRef, mapLoaded });

  const sessionMatch = useRouteMatch('sessionDetail');
  useOpenedSessionEffect(sessionMatch?.id ?? null);
};
