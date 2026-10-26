import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { lapIndexAtRecord, type LapSpan } from '@/lib/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { pickTerrainLineVertex } from '@/features/map/terrainLine.ts';
import type { DetailPath } from '@/features/map/zoneColoredPath.ts';
import { PICK_RADIUS } from '@/features/map/trackPicking.ts';

interface TrackPointerEvent {
  point: { x: number; y: number };
}

interface TrackTouchEvent extends TrackPointerEvent {
  points: unknown[];
}

// Touch input over the map has its touchend default prevented, so a tap never
// becomes a click; taps are recognised from the touch events instead.
const TAP_TOLERANCE_PX = 3;
const SYNTHETIC_CLICK_WINDOW_MS = 500;

const pickedLap = ({
  map,
  layerId,
  detailPath,
  spans,
  event,
}: {
  map: MapLibreMap;
  layerId: string;
  detailPath: DetailPath;
  spans: LapSpan[];
  event: TrackPointerEvent;
}): { hit: boolean; lapIndex: number | undefined } => {
  const vertex = pickTerrainLineVertex({
    map,
    layerId,
    point: [event.point.x, event.point.y],
    radius: PICK_RADIUS,
    path: detailPath.path,
  });
  if (vertex === undefined) return { hit: false, lapIndex: undefined };
  const recordIndex = detailPath.recordIndices[vertex];
  if (recordIndex === undefined) return { hit: true, lapIndex: undefined };
  return { hit: true, lapIndex: lapIndexAtRecord({ spans, recordIndex }) };
};

interface TrackTapHandlers {
  onClick: (event: TrackPointerEvent) => void;
  onTouchStart: (event: TrackTouchEvent) => void;
  onTouchMove: (event: TrackTouchEvent) => void;
  onTouchEnd: (event: TrackTouchEvent) => void;
}

const trackTapHandlers = (selectAt: (event: TrackPointerEvent) => void): TrackTapHandlers => {
  let tapStart: { x: number; y: number } | null = null;
  let lastTapAt = -Infinity;
  const onClick = (event: TrackPointerEvent) => {
    if (performance.now() - lastTapAt < SYNTHETIC_CLICK_WINDOW_MS) return;
    selectAt(event);
  };
  const onTouchStart = (event: TrackTouchEvent) => {
    tapStart = null;
    if (event.points.length === 1) tapStart = { x: event.point.x, y: event.point.y };
  };
  const onTouchMove = (event: TrackTouchEvent) => {
    if (tapStart === null) return;
    const moved = Math.hypot(event.point.x - tapStart.x, event.point.y - tapStart.y);
    if (event.points.length !== 1 || moved > TAP_TOLERANCE_PX) tapStart = null;
  };
  const onTouchEnd = (event: TrackTouchEvent) => {
    if (tapStart === null) return;
    tapStart = null;
    lastTapAt = performance.now();
    selectAt(event);
  };
  return { onClick, onTouchStart, onTouchMove, onTouchEnd };
};

const leaveTrack = () => {
  useMapControlsStore.getState().setTerrainTrackHovered(false);
  useMapControlsStore.getState().setHoveredLap(null);
};

export const useTerrainTrackPickingEffect = ({
  layerId,
  detailPath,
}: {
  layerId: string;
  detailPath: DetailPath | null;
}): void => {
  const map = useMap().current?.getMap();
  const spans = useMapControlsStore((s) => s.sessionLaps?.spans);
  const pointerFine = useDevice().pointerFine;

  useEffect(() => {
    if (map === undefined || detailPath === null || spans === undefined) return;
    const pick = (event: TrackPointerEvent) =>
      pickedLap({ map, layerId, detailPath, spans, event });
    const onMove = (event: TrackPointerEvent) => {
      const picked = pick(event);
      useMapControlsStore.getState().setTerrainTrackHovered(picked.hit);
      if (!pointerFine) return;
      useMapControlsStore.getState().setHoveredLap(picked.lapIndex ?? null);
    };
    const selectAt = (event: TrackPointerEvent) => {
      const lapIndex = pick(event).lapIndex;
      if (lapIndex !== undefined) useMapControlsStore.getState().toggleSelectedLap(lapIndex);
    };
    const taps = trackTapHandlers(selectAt);
    map.on('mousemove', onMove);
    map.on('click', taps.onClick);
    map.on('mouseout', leaveTrack);
    map.on('touchstart', taps.onTouchStart);
    map.on('touchmove', taps.onTouchMove);
    map.on('touchend', taps.onTouchEnd);
    return () => {
      map.off('mousemove', onMove);
      map.off('click', taps.onClick);
      map.off('mouseout', leaveTrack);
      map.off('touchstart', taps.onTouchStart);
      map.off('touchmove', taps.onTouchMove);
      map.off('touchend', taps.onTouchEnd);
      useMapControlsStore.getState().setTerrainTrackHovered(false);
    };
  }, [map, layerId, detailPath, spans, pointerFine]);
};
