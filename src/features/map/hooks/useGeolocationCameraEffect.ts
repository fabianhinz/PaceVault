import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { mapSidePadding } from '../mapSidePadding.ts';

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

    const side = mapSidePadding();

    mapRef.current.flyTo({
      center: position,
      zoom: 15,
      padding: { top: 0, bottom: side.bottom, left: 0, right: side.right },
      duration: 800,
    });
  }, [tracking, position, mapRef]);
};
