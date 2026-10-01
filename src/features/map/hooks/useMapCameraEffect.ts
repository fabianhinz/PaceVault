import { useEffect } from 'react';
import { densestClusterBounds, unionBounds } from '@/packages/engine/gps.ts';
import type { GPSBounds } from '@/packages/engine/types.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapTrack } from './useMapTracks.ts';
import { mapSidePadding } from '../mapSidePadding.ts';

export const useMapCameraEffect = (
  mapRef: React.RefObject<MapRef | null>,
  tracks: MapTrack[],
  openedSessionId: string | null,
  mapLoaded: boolean,
  fitAll: boolean,
  overrideBounds: GPSBounds | null,
) => {
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const side = mapSidePadding();

    if (overrideBounds) {
      mapRef.current.fitBounds(
        [
          [overrideBounds.minLng, overrideBounds.minLat],
          [overrideBounds.maxLng, overrideBounds.maxLat],
        ],
        {
          padding: { top: 80, bottom: 80 + side.bottom, left: 80, right: 80 + side.right },
          duration: 1200,
        },
      );
      return;
    }

    if (tracks.length === 0) return;

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
          padding: { top: 80, bottom: 80 + side.bottom, left: 80, right: 80 + side.right },
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
        padding: { top: 50, bottom: 50 + side.bottom, left: 50, right: 50 + side.right },
        duration: 1000,
      },
    );
  }, [tracks, openedSessionId, mapLoaded, mapRef, fitAll, overrideBounds]);
};
