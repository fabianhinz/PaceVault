import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { useSegmentFocusStore, type MapMarker } from '@/store/segmentFocus.ts';
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

type SegmentPath = NonNullable<ReturnType<typeof useSegmentMapTracks>['page']>;

interface MarkerDot {
  position: [number, number];
  color: [number, number, number, number];
}

const BEST_MARKER_FILL_COLOR: [number, number, number, number] = [
  ...BEST_MARKER_COLOR,
  trackModifiers.alpha.highlighted,
];

const pageLayer = (page: SegmentPath): PathLayer<SegmentPath> =>
  new PathLayer<SegmentPath>({
    id: 'segment-track',
    data: [page],
    getPath: (d) => d.path,
    getColor: (d) => [...TRACK_COLOR_BY_SPORT[d.sport], trackModifiers.alpha.highlighted],
    getWidth: trackModifiers.width.highlighted,
    widthMinPixels: 1,
    jointRounded: true,
    capRounded: true,
    pickable: false,
  });

const hoverLayer = (hovered: SegmentPath | null): PathLayer<SegmentPath> => {
  let data: SegmentPath[] = [];
  if (hovered !== null) data = [hovered];
  return new PathLayer<SegmentPath>({
    id: 'segment-hover',
    data,
    visible: hovered !== null,
    getPath: (d) => d.path,
    getColor: (d) => [...TRACK_COLOR_BY_SPORT[d.sport], trackModifiers.alpha.highlighted],
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
  const onTab = useMapScene().kind === 'segmentTab';
  const passMarker = useSegmentFocusStore((s) => s.passMarker);
  const bestMarker = useSegmentFocusStore((s) => s.bestMarker);
  const page = segmentMap.page;
  const hovered = segmentMap.hovered;

  return useMemo(() => {
    if (page !== null) return [pageLayer(page), markerLayer({ passMarker, bestMarker })];
    if (onTab) return [hoverLayer(hovered)];
    return [];
  }, [page, hovered, onTab, passMarker, bestMarker]);
};
