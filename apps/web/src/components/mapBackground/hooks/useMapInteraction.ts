import { useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  useStudioMapPopup,
  type StudioMapPopup,
} from '@/components/studio/hooks/useStudioMapPopup.ts';
import {
  useStudioRoutesPopup,
  type StudioRoutesPopup,
} from '@/components/studio/hooks/useStudioRoutesPopup.ts';
import { useMapPopupState, type MapPopupState } from './useMapPopupState.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import { useSegmentsPickPopup, type SegmentsPickPopupState } from './useSegmentsPickPopup.ts';
import { useSegmentMapTracks } from './useSegmentMapTracks.ts';
import type { MapTrack } from './types.ts';

interface MapInteraction {
  popupState: MapPopupState;
  studioPopup: StudioMapPopup;
  studioRoutesPopup: StudioRoutesPopup;
  segmentsPopup: SegmentsPickPopupState;
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
  const segmentsPopup = useSegmentsPickPopup(mapRef);
  const segmentsOnClick = segmentsPopup.onClick;
  const segmentsTab = useSegmentMapTracks().mode === 'tab';

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
      if (segmentsTab) return segmentsOnClick(info);
      return sessionsOnClick(info);
    },
    [
      sessionsOnClick,
      studioOnClick,
      routesOnClick,
      segmentsOnClick,
      segmentsTab,
      studioTracks.focusedRouteId,
    ],
  );

  const interactive =
    popupState.interactive &&
    !studioPopup.popup &&
    !studioRoutesPopup.popup &&
    !segmentsPopup.popup;

  return { popupState, studioPopup, studioRoutesPopup, segmentsPopup, onMapClick, interactive };
};
