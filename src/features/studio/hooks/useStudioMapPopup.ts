import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { useStudioStore } from '@/store/studio.ts';
import { distanceAtPosition } from '../markers/markerGeometry.ts';
import type { StudioTrackPickInfo } from '../markers/StudioTrackPickPopup.tsx';

/**
 * Pick state for clicks on the focused studio route: snaps the click to the
 * track, resolves its distance from the start, and anchors the marker-choice
 * popup there.
 */
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

    const distanceM = distanceAtPosition(routeId, route.encodedPolylines, [lng, lat]);
    setPopup({ x: info.x, y: info.y, routeId, distanceM });
  }, []);

  const close = useCallback(() => setPopup(null), []);

  return { popup, onClick, close };
};
