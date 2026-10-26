import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoutesPopupInfo } from '@/features/studio/types.ts';
import {
  pickBoundsFromCorners,
  filterTracksByPickBounds,
  decodeCached,
  PICK_RADIUS,
} from '@/features/map/trackPicking.ts';

export interface StudioRoutesPopup {
  popup: StudioRoutesPopupInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}

/**
 * Studio-tab counterpart to the session pick popup: a click on the map lists
 * every route near that point (bounds-based multi-pick, same as sessions), so
 * the user can jump into any of them.
 */
export const useStudioRoutesPopup = (mapRef: React.RefObject<MapRef | null>): StudioRoutesPopup => {
  const [popup, setPopup] = useState<StudioRoutesPopupInfo | null>(null);

  const onClick = useCallback(
    (info: PickingInfo) => {
      if (!mapRef.current) return;

      const topLeft = mapRef.current.unproject([info.x - PICK_RADIUS, info.y - PICK_RADIUS]);
      const bottomRight = mapRef.current.unproject([info.x + PICK_RADIUS, info.y + PICK_RADIUS]);
      const pickBounds = pickBoundsFromCorners(topLeft, bottomRight);

      const routes = useStudioStore.getState().routes;
      const pickable = routes.flatMap((route) =>
        route.encodedPolylines.map((encoded, segIndex) => ({
          sessionId: route.id,
          bounds: route.bounds,
          path: decodeCached({ sessionId: `studio-${route.id}-${segIndex}`, encoded }),
        })),
      );

      const hitIds = new Set(filterTracksByPickBounds({ tracks: pickable, pickBounds }));
      if (hitIds.size === 0) return;

      const hitRoutes = routes.filter((route) => hitIds.has(route.id));
      setPopup({ x: info.x, y: info.y, routes: hitRoutes });
    },
    [mapRef],
  );

  const close = useCallback(() => setPopup(null), []);

  return { popup, onClick, close };
};
