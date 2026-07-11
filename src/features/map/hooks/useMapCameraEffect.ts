import { useEffect } from 'react';
import { densestClusterBounds, unionBounds } from '@/packages/engine/gps.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapTrack } from './useMapTracks.ts';

export const useMapCameraEffect = (
  mapRef: React.RefObject<MapRef | null>,
  tracks: MapTrack[],
  openedSessionId: string | null,
  mapLoaded: boolean,
  fitAll: boolean,
) => {
  useEffect(() => {
    if (tracks.length === 0 || !mapRef.current || !mapLoaded) return;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    let rightPad = 0;
    if (isDesktop) {
      rightPad = window.innerWidth * 0.4;
    }

    if (openedSessionId) {
      const firstTrack = tracks[0];
      if (!firstTrack) return;
      const b = firstTrack.gps.bounds;
      mapRef.current.fitBounds(
        [
          [b.minLng, b.minLat],
          [b.maxLng, b.maxLat],
        ],
        {
          padding: { top: 80, bottom: 80, left: 80, right: 80 + rightPad },
          duration: 1200,
        },
      );
      return;
    }

    const allBounds = tracks.map((t) => t.gps.bounds);
    let bounds;
    if (fitAll) {
      bounds = unionBounds(allBounds);
    } else {
      bounds = densestClusterBounds(allBounds);
    }
    if (!bounds) return;
    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 + rightPad },
        duration: 1000,
      },
    );
  }, [tracks, openedSessionId, mapLoaded, mapRef, fitAll]);
};
