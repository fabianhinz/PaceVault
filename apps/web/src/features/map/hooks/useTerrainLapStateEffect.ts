import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { LapSpan } from '@/lib/lapRanges.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { lapVertexBounds } from '../lapPath.ts';
import {
  terrainHoverLine,
  terrainLineHoverSourceId,
  terrainLineRunIdsWithin,
  type TerrainLineRun,
} from '../terrainLine.ts';
import type { DetailPath } from '../zoneColoredPath.ts';

type MapControlsState = ReturnType<typeof useMapControlsStore.getState>;

interface LapLine {
  map: MapLibreMap;
  sourceId: string;
  detailPath: DetailPath;
  runs: TerrainLineRun[];
}

interface ShownLaps {
  spans: LapSpan[] | undefined;
  selected: number | null;
  preview: number | null;
  selectedRunIds: number[];
}

const lapBounds = (line: LapLine, spans: LapSpan[] | undefined, lapIndex: number | null) => {
  const span = spans?.find((candidate) => candidate.lapIndex === lapIndex);
  if (span === undefined) return null;
  return lapVertexBounds({ detailPath: line.detailPath, span });
};

const markSelected = (line: LapLine, runIds: number[], selected: boolean) => {
  if (line.map.getSource(line.sourceId) === undefined) return;
  for (const id of runIds)
    line.map.setFeatureState({ source: line.sourceId, id }, { sel: selected });
};

const showHover = (line: LapLine, path: [number, number][] | null) => {
  const source = line.map.getSource<GeoJSONSource>(terrainLineHoverSourceId(line.sourceId));
  source?.setData(terrainHoverLine(path));
};

const previewLapIndex = (state: MapControlsState): number | null => {
  if (state.hoveredLapIndex === state.selectedLapIndex) return null;
  return state.hoveredLapIndex;
};

const syncSelected = (line: LapLine, shown: ShownLaps, state: MapControlsState) => {
  const spans = state.sessionLaps?.spans;
  if (spans === shown.spans && state.selectedLapIndex === shown.selected) return;
  markSelected(line, shown.selectedRunIds, false);
  const bounds = lapBounds(line, spans, state.selectedLapIndex);
  shown.selectedRunIds = [];
  if (bounds !== null)
    shown.selectedRunIds = terrainLineRunIdsWithin({ runs: line.runs, ...bounds });
  markSelected(line, shown.selectedRunIds, true);
  shown.selected = state.selectedLapIndex;
};

const syncPreview = (line: LapLine, shown: ShownLaps, state: MapControlsState) => {
  const spans = state.sessionLaps?.spans;
  const preview = previewLapIndex(state);
  if (spans === shown.spans && preview === shown.preview) return;
  const bounds = lapBounds(line, spans, preview);
  showHover(line, bounds && line.detailPath.path.slice(bounds.first, bounds.last + 1));
  shown.preview = preview;
};

const syncLaps = (line: LapLine, shown: ShownLaps, state: MapControlsState) => {
  syncSelected(line, shown, state);
  syncPreview(line, shown, state);
  shown.spans = state.sessionLaps?.spans;
};

export const useTerrainLapStateEffect = ({
  sourceId,
  detailPath,
  runs,
}: {
  sourceId: string;
  detailPath: DetailPath | null;
  runs: TerrainLineRun[];
}): void => {
  const map = useMap().current?.getMap();

  useEffect(() => {
    if (map === undefined || detailPath === null || map.getSource(sourceId) === undefined) return;
    const line: LapLine = { map, sourceId, detailPath, runs };
    const shown: ShownLaps = { spans: [], selected: null, preview: null, selectedRunIds: [] };
    syncLaps(line, shown, useMapControlsStore.getState());
    const unsubscribe = useMapControlsStore.subscribe((state) => syncLaps(line, shown, state));
    return () => {
      unsubscribe();
      markSelected(line, shown.selectedRunIds, false);
      showHover(line, null);
    };
  }, [map, sourceId, detailPath, runs]);
};
