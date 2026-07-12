import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useGeolocationStore } from '@/store/geolocation.ts';

/**
 * Recenters the camera once when the first fix of a tracking session arrives
 * (Apple/Google Maps pattern), then leaves the camera under the user's control
 * until they toggle tracking again. Reuses the same desktop right-padding
 * convention as useMapCameraEffect so the located point clears the detail panel.
 */
export const useGeolocationCameraEffect = (mapRef: React.RefObject<MapRef | null>) => {
  const tracking = useGeolocationStore((s) => s.tracking);
  const position = useGeolocationStore((s) => s.position);
  const flownRef = useRef(false);

  useEffect(() => {
    if (!tracking) {
      flownRef.current = false;
      return;
    }
    if (!position || flownRef.current || !mapRef.current) {
      return;
    }
    flownRef.current = true;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    let rightPad = 0;
    if (isDesktop) {
      rightPad = window.innerWidth * 0.4;
    }

    mapRef.current.flyTo({
      center: position,
      zoom: 15,
      padding: { top: 0, bottom: 0, left: 0, right: rightPad },
      duration: 800,
    });
  }, [tracking, position, mapRef]);
};
