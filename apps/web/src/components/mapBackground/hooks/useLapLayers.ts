import { useDeferredValue, useMemo } from 'react';
import type { Layer, LayersList } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';
import type { LapSpan } from '@/lib/analysis/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { lapSubPath } from '@/components/mapBackground/lapPath.ts';
import type { DetailPath } from '@/components/mapBackground/zoneColoredPath.ts';
import { LAP_CASING_SCALE, trackModifiers } from '@/components/mapBackground/trackColors.ts';

const LAP_CASING_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const LAP_HOVER_COLOR: [number, number, number, number] = [255, 255, 255, 255];

const lapPathFor = ({
  detailPath,
  spans,
  lapIndex,
}: {
  detailPath: DetailPath | null;
  spans: LapSpan[] | undefined;
  lapIndex: number | null;
}): DetailPath | null => {
  if (lapIndex === null || !detailPath || !spans) return null;
  const span = spans.find((candidate) => candidate.lapIndex === lapIndex);
  if (!span) return null;
  return lapSubPath({ detail: detailPath, span });
};

interface LapLayers {
  lapSpans: LapSpan[] | undefined;
  selectedLapPath: DetailPath | null;
  lapHoverLayer: Layer | null;
  lapLayers: LayersList;
}

export const useLapLayers = ({
  terrain,
  detailPath,
}: {
  terrain: boolean;
  detailPath: DetailPath | null;
}): LapLayers => {
  const lapSpans = useDeferredValue(useMapControlsStore((s) => s.sessionLaps?.spans));
  const selectedLapIndex = useMapControlsStore((s) => s.selectedLapIndex);
  const hoveredLapIndex = useMapControlsStore((s) => {
    if (terrain) return null;
    return s.hoveredLapIndex;
  });
  const trackColorMode = useMapControlsStore((s) => s.trackColorMode);

  const selectedLapPath = useMemo(
    () => lapPathFor({ detailPath, spans: lapSpans, lapIndex: selectedLapIndex }),
    [selectedLapIndex, detailPath, lapSpans],
  );
  let previewLapIndex = hoveredLapIndex;
  if (previewLapIndex === selectedLapIndex) {
    previewLapIndex = null;
  }
  const hoveredLapPath = useMemo(
    () => lapPathFor({ detailPath, spans: lapSpans, lapIndex: previewLapIndex }),
    [previewLapIndex, detailPath, lapSpans],
  );

  const lapHoverLayer = useMemo(() => {
    if (!detailPath) return null;
    let data: DetailPath[] = [];
    if (hoveredLapPath) data = [hoveredLapPath];
    return new PathLayer<DetailPath>({
      id: 'lap-hover',
      data,
      visible: hoveredLapPath !== null,
      getPath: (d) => d.path,
      getColor: LAP_HOVER_COLOR,
      getWidth: 3,
      widthUnits: 'pixels',
      jointRounded: true,
      capRounded: true,
      pickable: false,
    });
  }, [detailPath, hoveredLapPath]);

  const lapLayers = useMemo(() => {
    const layers = [];
    if (selectedLapPath) {
      layers.push(
        new PathLayer<DetailPath>({
          id: 'lap-casing',
          data: [selectedLapPath],
          getPath: (d) => d.path,
          getColor: LAP_CASING_COLOR,
          getWidth: trackModifiers.width.highlighted * LAP_CASING_SCALE,
          widthMinPixels: 9,
          jointRounded: true,
          capRounded: true,
          pickable: false,
        }),
        new PathLayer<DetailPath>({
          id: 'lap-selected',
          data: [selectedLapPath],
          getPath: (d) => d.path,
          getColor: (d) => d.color,
          getWidth: trackModifiers.width.highlighted,
          widthMinPixels: 5,
          jointRounded: true,
          capRounded: true,
          pickable: false,
          updateTriggers: { getColor: [trackColorMode] },
        }),
      );
    }
    return layers;
  }, [selectedLapPath, trackColorMode]);

  return { lapSpans, selectedLapPath, lapHoverLayer, lapLayers };
};
