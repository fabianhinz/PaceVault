import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { lapIndexAtRecord, type LapSpan } from '@/lib/lapRanges.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { pickTerrainLineVertex } from '../terrainLine.ts';
import type { DetailPath } from '../zoneColoredPath.ts';
import { PICK_RADIUS } from './types.ts';

interface TrackPointerEvent {
  point: { x: number; y: number };
}

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
  return { hit: true, lapIndex: lapIndexAtRecord(spans, recordIndex) };
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
    const onClick = (event: TrackPointerEvent) => {
      const lapIndex = pick(event).lapIndex;
      if (lapIndex !== undefined) useMapControlsStore.getState().toggleSelectedLap(lapIndex);
    };
    map.on('mousemove', onMove);
    map.on('click', onClick);
    map.on('mouseout', leaveTrack);
    return () => {
      map.off('mousemove', onMove);
      map.off('click', onClick);
      map.off('mouseout', leaveTrack);
      useMapControlsStore.getState().setTerrainTrackHovered(false);
    };
  }, [map, layerId, detailPath, spans, pointerFine]);
};
