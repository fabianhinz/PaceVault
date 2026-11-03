import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { useSegmentFocusStore, type MapMarker } from '@/store/segmentFocus.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import {
  ADDITIVE_BLEND,
  ALPHA_BY_TRACK_INTENSITY,
  BEST_MARKER_COLOR,
  TRACK_COLOR_BY_SPORT,
  trackModifiers,
} from '@/components/mapBackground/trackColors.ts';
import { useMapPreferencesStore, type TrackIntensity } from '@/store/mapPreferences.ts';
import { useSegmentMapTracks } from './useSegmentMapTracks.ts';

interface SegmentPath {
  segment: Segment;
  path: [number, number][];
}

interface MarkerDot {
  position: [number, number];
  color: [number, number, number];
}

const MARKER_RADIUS_PX = 7;
const MARKER_STROKE_PX = 2;
const MARKER_STROKE: [number, number, number, number] = [0, 0, 0, 80];

const pathOf = (segment: Segment): SegmentPath => ({
  segment,
  path: segment.geometry.map((point) => [point[1], point[0]]),
});

const pageLayer = ({
  page,
  trackIntensity,
}: {
  page: SegmentPath;
  trackIntensity: TrackIntensity;
}): PathLayer<SegmentPath> =>
  new PathLayer<SegmentPath>({
    id: 'segment-track',
    data: [page],
    getPath: (d) => d.path,
    getColor: (d) => [
      ...TRACK_COLOR_BY_SPORT[d.segment.sport],
      ALPHA_BY_TRACK_INTENSITY[trackIntensity],
    ],
    getWidth: trackModifiers.width.default,
    widthMinPixels: 1,
    jointRounded: true,
    capRounded: true,
    pickable: false,
    parameters: ADDITIVE_BLEND,
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
  segment,
}: {
  passMarker: MapMarker | null;
  bestMarker: MapMarker | null;
  segment: Segment;
}): ScatterplotLayer<MarkerDot> => {
  const dots: MarkerDot[] = [];
  if (bestMarker !== null)
    dots.push({ position: [bestMarker[1], bestMarker[0]], color: BEST_MARKER_COLOR });
  if (passMarker !== null) {
    dots.push({
      position: [passMarker[1], passMarker[0]],
      color: TRACK_COLOR_BY_SPORT[segment.sport],
    });
  }
  return new ScatterplotLayer<MarkerDot>({
    id: 'segment-markers',
    data: dots,
    getPosition: (d) => d.position,
    getRadius: MARKER_RADIUS_PX,
    radiusUnits: 'pixels',
    getFillColor: (d) => [...d.color, 255],
    filled: true,
    stroked: true,
    getLineColor: MARKER_STROKE,
    lineWidthUnits: 'pixels',
    getLineWidth: MARKER_STROKE_PX,
    pickable: false,
  });
};

export const useSegmentLayers = (): LayersList => {
  const segmentMap = useSegmentMapTracks();
  const hoveredId = useSegmentFocusStore((s) => s.hoveredSegmentId);
  const passMarker = useSegmentFocusStore((s) => s.passMarker);
  const bestMarker = useSegmentFocusStore((s) => s.bestMarker);
  const segments = segmentMap.segments;
  const mode = segmentMap.mode;
  const trackIntensity = useMapPreferencesStore((s) => s.trackIntensity);

  return useMemo(() => {
    if (mode === 'tab') {
      const hovered = segments.find((segment) => segment.id === hoveredId);
      let hoveredPath: SegmentPath | undefined = undefined;
      if (hovered !== undefined) hoveredPath = pathOf(hovered);
      return [hoverLayer(hoveredPath)];
    }
    const page = segments[0];
    if (mode === 'off' || page === undefined) return [];
    return [
      pageLayer({ page: pathOf(page), trackIntensity }),
      markerLayer({ passMarker, bestMarker, segment: page }),
    ];
  }, [mode, segments, hoveredId, passMarker, bestMarker, trackIntensity]);
};
