import { useState, useCallback } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { pickSessionsAt } from '@/components/mapBackground/trackPicking.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapTrack } from './types.ts';
import type { PopupInfo } from '@/components/sessions/types.ts';
import type { PickingInfo } from '@deck.gl/core';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useMapScene } from './useMapScene.ts';

type PickHandler = (info: PickingInfo) => boolean;

export interface MapPopupState {
  popup: PopupInfo | null;
  hoveringTrack: boolean;
  interactive: boolean;
  onClick: PickHandler;
  onHover: PickHandler;
  closePopup: () => void;
  onPointerLeave: () => void;
}

export const useMapPopupState = ({
  mapRef,
  tracks,
}: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}): MapPopupState => {
  const sessionScene = useMapScene().kind === 'session';
  const pointerFine = useDevice().pointerFine;

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup;

  const onClick = useCallback(
    (info: PickingInfo) => {
      const stopPropagation = false;

      if (!info.object || !mapRef.current || sessionScene) {
        return stopPropagation;
      }

      const center = mapRef.current.unproject([info.x, info.y]);
      const sessions = pickSessionsAt({ map: mapRef.current, info, tracks });

      if (sessions.length === 0) {
        return stopPropagation;
      }

      if (pointerFine) useMapFocusStore.getState().setPickCircle([center.lng, center.lat]);
      setPopup({ x: info.x, y: info.y, sessions });

      return stopPropagation;
    },
    [tracks, sessionScene, mapRef, pointerFine],
  );

  const closePopup = useCallback(() => {
    setPopup(null);
    useMapFocusStore.getState().clearPickCircle();
  }, []);

  const onHover = useCallback(
    (info: PickingInfo) => {
      const stopPropagation = false;
      const lapPick =
        info.layer?.id === 'session-detail' && useMapControlsStore.getState().sessionLaps !== null;
      const pickable = !!info.object && (!sessionScene || lapPick);
      setHoveringTrack(pickable);
      if (!popup) {
        if (
          pickable &&
          pointerFine &&
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
    [popup, sessionScene, pointerFine],
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
