import { useCallback, useState } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import type { MapRef } from 'react-map-gl/maplibre';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { pickSegmentsAt } from '@/components/mapBackground/trackPicking.ts';
import { useSegmentMapTracks } from './useSegmentMapTracks.ts';

export interface SegmentsPickPopupInfo {
  x: number;
  y: number;
  segments: Segment[];
}

export interface SegmentsPickPopupState {
  popup: SegmentsPickPopupInfo | null;
  onClick: (info: PickingInfo) => boolean;
  close: () => void;
}

export const useSegmentsPickPopup = (
  mapRef: React.RefObject<MapRef | null>,
): SegmentsPickPopupState => {
  const segments = useSegmentMapTracks().segments;
  const pointerFine = useDevice().pointerFine;
  const [popup, setPopup] = useState<SegmentsPickPopupInfo | null>(null);

  const onClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object || !mapRef.current) return false;
      const picked = pickSegmentsAt({ map: mapRef.current, info, segments });
      if (picked.length === 0) return false;
      const center = mapRef.current.unproject([info.x, info.y]);
      if (pointerFine) useMapFocusStore.getState().setPickCircle([center.lng, center.lat]);
      setPopup({ x: info.x, y: info.y, segments: picked });
      return false;
    },
    [mapRef, segments, pointerFine],
  );

  const close = useCallback(() => {
    setPopup(null);
    useMapFocusStore.getState().clearPickCircle();
  }, []);

  return { popup, onClick, close };
};
