import { useEffect } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

const suppressEmulatedMouse = (event: TouchEvent) => {
  if (event.cancelable) event.preventDefault();
};

export const useSuppressTapMouseEffect = (
  mapRef: React.RefObject<MapRef | null>,
  mapLoaded: boolean,
) => {
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const container = mapRef.current.getMap().getCanvasContainer();
    container.addEventListener('touchend', suppressEmulatedMouse, { passive: false });
    return () => container.removeEventListener('touchend', suppressEmulatedMouse);
  }, [mapRef, mapLoaded]);
};
