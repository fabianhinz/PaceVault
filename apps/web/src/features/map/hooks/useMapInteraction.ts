import { useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  useStudioMapPopup,
  type StudioMapPopup,
} from '@/features/studio/hooks/useStudioMapPopup.ts';
import {
  useStudioRoutesPopup,
  type StudioRoutesPopup,
} from '@/features/studio/hooks/useStudioRoutesPopup.ts';
import { useMapPopupState, type MapPopupState } from './useMapPopupState.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import type { MapTrack } from './types.ts';

interface MapInteraction {
  popupState: MapPopupState;
  studioPopup: StudioMapPopup;
  studioRoutesPopup: StudioRoutesPopup;
  onMapClick: (info: PickingInfo) => boolean | undefined;
  interactive: boolean;
}

export const useMapInteraction = ({
  mapRef,
  tracks,
}: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}): MapInteraction => {
  const popupState = useMapPopupState({ mapRef, tracks });
  const studioPopup = useStudioMapPopup();
  const studioRoutesPopup = useStudioRoutesPopup(mapRef);
  const studioTracks = useStudioMapTracks();

  const sessionsOnClick = popupState.onClick;
  const studioOnClick = studioPopup.onClick;
  const routesOnClick = studioRoutesPopup.onClick;

  const onMapClick = useCallback(
    (info: PickingInfo) => {
      if (info.layer?.id === 'studio-routes') {
        if (studioTracks.focusedRouteId) {
          studioOnClick(info);
        } else {
          routesOnClick(info);
        }
        return;
      }
      return sessionsOnClick(info);
    },
    [sessionsOnClick, studioOnClick, routesOnClick, studioTracks.focusedRouteId],
  );

  const interactive = popupState.interactive && !studioPopup.popup && !studioRoutesPopup.popup;

  return { popupState, studioPopup, studioRoutesPopup, onMapClick, interactive };
};
