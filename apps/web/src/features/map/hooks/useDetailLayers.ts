import { useMemo } from 'react';
import type { Layer, LayersList, PickingInfo } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';
import { lapIndexAtRecord } from '@/lib/laps.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { dimmedColor, nearestRecordIndex } from '@/features/map/lapPath.ts';
import type { DetailPath } from '@/features/map/zoneColoredPath.ts';
import { LAP_DIMMED_BRIGHTNESS, trackModifiers } from '@/features/map/trackColors.ts';
import { useSessionDetailPath } from './useSessionDetailPath.ts';
import { useLapLayers } from './useLapLayers.ts';
import type { DeckEventHandlers, PickHandler } from './types.ts';

interface DetailLayers {
  detailPath: DetailPath | null;
  selectedLapPath: DetailPath | null;
  detailLayer: Layer | null;
  lapHoverLayer: Layer | null;
  lapLayers: LayersList;
}

export const useDetailLayers = ({
  terrain,
  eventHandlers,
}: {
  terrain: boolean;
  eventHandlers: DeckEventHandlers;
}): DetailLayers => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const sessions = useSessionsStore((s) => s.sessions);
  const trackColorMode = useMapControlsStore((s) => s.trackColorMode);
  const pointerFine = useDevice().pointerFine;
  const detailPath = useSessionDetailPath({ hoveredSessionId, openedSessionId, sessions });
  const lapLayers = useLapLayers({ terrain, detailPath });
  const lapSpans = lapLayers.lapSpans;
  const selectedLapPath = lapLayers.selectedLapPath;

  const detailHandlers = useMemo(() => {
    const lapAt = (info: PickingInfo) => {
      if (!detailPath || !lapSpans || !info.coordinate) return undefined;
      const lng = info.coordinate[0];
      const lat = info.coordinate[1];
      if (lng === undefined || lat === undefined) return undefined;
      const recordIndex = nearestRecordIndex({ detail: detailPath, coordinate: [lng, lat] });
      if (recordIndex === undefined) return undefined;
      return lapIndexAtRecord({ spans: lapSpans, recordIndex });
    };
    const onClick: PickHandler = (info, event) => {
      const lapIndex = lapAt(info);
      if (lapIndex === undefined) return eventHandlers.onClick?.(info, event);
      useMapControlsStore.getState().toggleSelectedLap(lapIndex);
      return true;
    };
    const onHover: PickHandler = (info, event) => {
      let lapIndex: number | null = null;
      if (pointerFine && info.object) {
        lapIndex = lapAt(info) ?? null;
      }
      useMapControlsStore.getState().setHoveredLap(lapIndex);
      return eventHandlers.onHover?.(info, event);
    };
    if (!eventHandlers.onClick) return {};
    return { onClick, onHover };
  }, [detailPath, lapSpans, eventHandlers, pointerFine]);

  const detailLayer = useMemo(() => {
    if (!detailPath) {
      return null;
    }

    const dimmed = selectedLapPath !== null;
    return new PathLayer<DetailPath>({
      id: 'session-detail',
      data: [detailPath],
      getPath: (d) => d.path,
      getColor: (d) => {
        if (dimmed) return dimmedColor(d.color, LAP_DIMMED_BRIGHTNESS);
        return d.color;
      },
      getWidth: trackModifiers.width.highlighted,
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: true,
      updateTriggers: { getColor: [trackColorMode, openedSessionId, dimmed] },
      ...detailHandlers,
    });
  }, [detailPath, trackColorMode, openedSessionId, detailHandlers, selectedLapPath]);

  return {
    detailPath,
    selectedLapPath,
    detailLayer,
    lapHoverLayer: lapLayers.lapHoverLayer,
    lapLayers: lapLayers.lapLayers,
  };
};
