import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { mapPadding } from '@/features/map/mapPadding.ts';

const GEOLOCATION_FLY_DURATION_MS = 800;

export const useGeolocationCameraEffect = (mapRef: React.RefObject<MapRef | null>): void => {
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

    mapRef.current.flyTo({
      center: position,
      zoom: 15,
      padding: mapPadding(0),
      duration: GEOLOCATION_FLY_DURATION_MS,
    });
  }, [tracking, position, mapRef]);
};
