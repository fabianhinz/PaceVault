import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { HIGHLIGHT_TRANSITIONS, studioRouteModifiers } from '@/features/map/trackColors.ts';
import { decodeCached } from '@/features/map/trackPicking.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import type { DeckEventHandlers } from './types.ts';

export const useStudioRouteLayer = (eventHandlers: DeckEventHandlers): Layer | null => {
  const hoveredStudioRouteId = useMapFocusStore((s) => s.hoveredStudioRouteId);
  const studioTracks = useStudioMapTracks();
  const pointerFine = useDevice().pointerFine;

  const studioSegments = useMemo(
    () =>
      studioTracks.routes.flatMap((route) =>
        route.encodedPolylines.map((encodedPolyline, segIndex) => ({
          routeId: route.id,
          segIndex,
          encodedPolyline,
          color: route.color,
        })),
      ),
    [studioTracks.routes],
  );

  return useMemo(() => {
    if (studioSegments.length === 0) {
      return null;
    }

    const highlightedRouteId = hoveredStudioRouteId ?? studioTracks.focusedRouteId;
    let transitions: typeof HIGHLIGHT_TRANSITIONS | undefined;
    if (pointerFine) transitions = HIGHLIGHT_TRANSITIONS;

    return new PathLayer<(typeof studioSegments)[number]>({
      id: 'studio-routes',
      data: studioSegments,
      getPath: (d) =>
        decodeCached({
          sessionId: `studio-${d.routeId}-${d.segIndex}`,
          encoded: d.encodedPolyline,
        }),
      getColor: (d) => {
        let alpha = studioRouteModifiers.alpha.default;
        if (hoveredStudioRouteId && hoveredStudioRouteId !== d.routeId) {
          alpha = studioRouteModifiers.alpha.hidden;
        }
        return [d.color[0], d.color[1], d.color[2], alpha];
      },
      getWidth: (d) => {
        if (d.routeId === highlightedRouteId) return studioRouteModifiers.width.highlighted;
        return studioRouteModifiers.width.default;
      },
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: studioTracks.active,
      updateTriggers: {
        getColor: [highlightedRouteId, hoveredStudioRouteId],
        getWidth: [highlightedRouteId],
      },
      transitions,
      ...eventHandlers,
    });
  }, [
    studioSegments,
    studioTracks.active,
    studioTracks.focusedRouteId,
    hoveredStudioRouteId,
    eventHandlers,
    pointerFine,
  ]);
};
