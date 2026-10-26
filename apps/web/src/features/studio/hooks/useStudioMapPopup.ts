import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { useStudioStore } from '@/store/studio.ts';
import { getStudioRoutePoints } from '@/lib/db.ts';
import { routeDistanceAtPosition } from '@pacevault/gpx/routeCut.ts';
import type { StudioTrackPickInfo } from '@/features/studio/types.ts';

export interface StudioMapPopup {
  popup: StudioTrackPickInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}

export const useStudioMapPopup = (): StudioMapPopup => {
  const [popup, setPopup] = useState<StudioTrackPickInfo | null>(null);

  const onClick = useCallback((info: PickingInfo) => {
    const routeId = (info.object as { routeId?: string } | null)?.routeId;
    if (!routeId || !info.coordinate) return;

    const lng = info.coordinate[0];
    const lat = info.coordinate[1];
    if (lng == null || lat == null) return;

    const route = useStudioStore.getState().routes.find((r) => r.id === routeId);
    if (!route) return;

    const x = info.x;
    const y = info.y;
    void getStudioRoutePoints(routeId).then((points) => {
      const distanceM = routeDistanceAtPosition({ points, position: { lat, lng } });
      if (distanceM === null) return;
      setPopup({ x, y, routeId, distanceM });
    });
  }, []);

  const close = useCallback(() => setPopup(null), []);

  return { popup, onClick, close };
};
