import { useState, useCallback } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { pickBoundsFromCorners, filterTracksByPickBounds } from '@/features/map/trackPicking.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapTrack } from './useMapTracks.ts';
import type { PopupInfo } from '@/features/sessions/SessionsPickPopup.tsx';
import { decodeCached, PICK_RADIUS } from './types.ts';
import type { PickingInfo } from '@deck.gl/core';

export const useMapPopupState = (mapRef: React.RefObject<MapRef | null>, tracks: MapTrack[]) => {
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup;

  const onClick = useCallback(
    (info: PickingInfo) => {
      const stopPropagation = false;

      if (!info.object || !mapRef.current || openedSessionId) {
        return stopPropagation;
      }

      const center = mapRef.current.unproject([info.x, info.y]);

      const topLeft = mapRef.current.unproject([info.x - PICK_RADIUS, info.y - PICK_RADIUS]);
      const bottomRight = mapRef.current.unproject([info.x + PICK_RADIUS, info.y + PICK_RADIUS]);

      const pickBounds = pickBoundsFromCorners(topLeft, bottomRight);
      const pickable = tracks.map((t) => ({
        sessionId: t.sessionId,
        bounds: t.gps.bounds,
        path: decodeCached(t.sessionId, t.gps.encodedPolyline),
      }));
      const hitIds = filterTracksByPickBounds(pickable, pickBounds);

      if (hitIds.length === 0) {
        return stopPropagation;
      }

      const hitSet = new Set(hitIds);
      const sessions = tracks.filter((t) => hitSet.has(t.sessionId)).map((t) => t.session);

      useMapFocusStore.getState().setPickCircle([center.lng, center.lat]);
      setPopup({ x: info.x, y: info.y, sessions });

      return stopPropagation;
    },
    [tracks, openedSessionId, mapRef],
  );

  const closePopup = useCallback(() => {
    setPopup(null);
    useMapFocusStore.getState().clearPickCircle();
  }, []);

  const onHover = useCallback(
    (info: PickingInfo) => {
      const stopPropagation = false;
      const isLapPick =
        info.layer?.id === 'session-detail' && useMapFocusStore.getState().sessionLaps !== null;
      setHoveringTrack(!!info.object && (!openedSessionId || isLapPick));
      if (!popup) {
        if (
          !openedSessionId &&
          info.object &&
          info.coordinate &&
          info.coordinate[0] != null &&
          info.coordinate[1] != null
        ) {
          useMapFocusStore.getState().setPickCircle([info.coordinate[0], info.coordinate[1]]);
        } else {
          useMapFocusStore.getState().clearPickCircle();
        }
      }

      return stopPropagation;
    },
    [popup, openedSessionId],
  );

  const onPointerLeave = useCallback(() => {
    setHoveringTrack(false);
    if (!popup) useMapFocusStore.getState().clearPickCircle();
  }, [popup]);

  return {
    popup,
    hoveringTrack,
    interactive,
    onClick,
    onHover,
    closePopup,
    onPointerLeave,
  };
};
