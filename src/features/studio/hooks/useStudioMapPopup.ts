import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { useStudioStore } from '@/store/studio.ts';
import { getStudioRoutePoints } from '@/lib/indexeddb.ts';
import { routeDistanceAtPosition } from '@/packages/gpx/routeCut.ts';
import type { StudioTrackPickInfo } from '../markers/StudioTrackPickPopup.tsx';

export const useStudioMapPopup = () => {
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
    getStudioRoutePoints(routeId).then((points) => {
      const distanceM = routeDistanceAtPosition(points, { lat, lng });
      if (distanceM === null) return;
      setPopup({ x, y, routeId, distanceM });
    });
  }, []);

  const close = useCallback(() => setPopup(null), []);

  return { popup, onClick, close };
};
