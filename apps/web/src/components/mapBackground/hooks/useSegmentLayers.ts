import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { useSegmentFocusStore, type MapMarker } from '@/store/segmentFocus.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { sceneHoveredId } from '@/components/mapBackground/mapScene.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import {
  BEST_MARKER_COLOR,
  HOVER_MARKER_FILL_COLOR,
  HOVER_MARKER_RADIUS_PX,
  HOVER_MARKER_RING_COLOR,
  HOVER_MARKER_RING_WIDTH_PX,
  TRACK_COLOR_BY_SPORT,
  trackModifiers,
} from '@/components/mapBackground/trackColors.ts';
import { useSegmentMapTracks } from './useSegmentMapTracks.ts';
import { useMapScene } from './useMapScene.ts';

interface SegmentPath {
  segment: MatchedSegment;
  path: [number, number][];
}

interface MarkerDot {
  position: [number, number];
  color: [number, number, number, number];
}

const BEST_MARKER_FILL_COLOR: [number, number, number, number] = [
  ...BEST_MARKER_COLOR,
  trackModifiers.alpha.highlighted,
];

const pathOf = (segment: MatchedSegment): SegmentPath => ({
  segment,
  path: segment.geometry.map((point) => [point[1], point[0]]),
});

const pageLayer = (page: SegmentPath): PathLayer<SegmentPath> =>
  new PathLayer<SegmentPath>({
    id: 'segment-track',
    data: [page],
    getPath: (d) => d.path,
    getColor: (d) => [...TRACK_COLOR_BY_SPORT[d.segment.sport], trackModifiers.alpha.highlighted],
    getWidth: trackModifiers.width.highlighted,
    widthMinPixels: 1,
    jointRounded: true,
    capRounded: true,
    pickable: false,
  });

const hoverLayer = (hovered: SegmentPath | undefined): PathLayer<SegmentPath> => {
  let data: SegmentPath[] = [];
  if (hovered !== undefined) data = [hovered];
  return new PathLayer<SegmentPath>({
    id: 'segment-hover',
    data,
    visible: hovered !== undefined,
    getPath: (d) => d.path,
    getColor: (d) => [...TRACK_COLOR_BY_SPORT[d.segment.sport], trackModifiers.alpha.highlighted],
    getWidth: trackModifiers.width.highlighted,
    widthMinPixels: 1,
    jointRounded: true,
    capRounded: true,
    pickable: false,
  });
};

const markerLayer = ({
  passMarker,
  bestMarker,
}: {
  passMarker: MapMarker | null;
  bestMarker: MapMarker | null;
}): ScatterplotLayer<MarkerDot> => {
  const dots: MarkerDot[] = [];
  if (bestMarker !== null) {
    dots.push({ position: [bestMarker[1], bestMarker[0]], color: BEST_MARKER_FILL_COLOR });
  }
  if (passMarker !== null) {
    dots.push({ position: [passMarker[1], passMarker[0]], color: HOVER_MARKER_FILL_COLOR });
  }
  return new ScatterplotLayer<MarkerDot>({
    id: 'segment-markers',
    data: dots,
    getPosition: (d) => d.position,
    getRadius: HOVER_MARKER_RADIUS_PX,
    radiusUnits: 'pixels',
    getFillColor: (d) => d.color,
    filled: true,
    stroked: true,
    getLineColor: HOVER_MARKER_RING_COLOR,
    lineWidthUnits: 'pixels',
    getLineWidth: HOVER_MARKER_RING_WIDTH_PX,
    pickable: false,
  });
};

export const useSegmentLayers = (): LayersList => {
  const segmentMap = useSegmentMapTracks();
  const sceneKey = useMapScene().key;
  const hoveredId = useMapFocusStore((s) =>
    sceneHoveredId({ hover: s.mapHover, sceneKey, kind: 'segment' }),
  );
  const passMarker = useSegmentFocusStore((s) => s.passMarker);
  const bestMarker = useSegmentFocusStore((s) => s.bestMarker);
  const segments = segmentMap.segments;
  const mode = segmentMap.mode;

  return useMemo(() => {
    if (mode === 'tab') {
      const hovered = segments.find((segment) => segment.id === hoveredId);
      let hoveredPath: SegmentPath | undefined = undefined;
      if (hovered !== undefined) hoveredPath = pathOf(hovered);
      return [hoverLayer(hoveredPath)];
    }
    const page = segments[0];
    if (mode === 'off' || page === undefined) return [];
    return [pageLayer(pathOf(page)), markerLayer({ passMarker, bestMarker })];
  }, [mode, segments, hoveredId, passMarker, bestMarker]);
};
