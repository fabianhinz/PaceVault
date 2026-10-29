import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { LapSpan } from '@/lib/analysis/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { lapVertexBounds } from '@/components/mapBackground/lapPath.ts';
import {
  terrainHoverLine,
  terrainLineHoverSourceId,
  terrainLineRunIdsWithin,
  type TerrainLineRun,
} from '@/components/mapBackground/terrainLine.ts';
import type { DetailPath } from '@/components/mapBackground/zoneColoredPath.ts';

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

const lapBounds = ({
  line,
  spans,
  lapIndex,
}: {
  line: LapLine;
  spans: LapSpan[] | undefined;
  lapIndex: number | null;
}) => {
  const span = spans?.find((candidate) => candidate.lapIndex === lapIndex);
  if (span === undefined) return null;
  return lapVertexBounds({ detailPath: line.detailPath, span });
};

const markSelected = ({
  line,
  runIds,
  selected,
}: {
  line: LapLine;
  runIds: number[];
  selected: boolean;
}) => {
  if (line.map.getSource(line.sourceId) === undefined) return;
  for (const id of runIds)
    line.map.setFeatureState({ source: line.sourceId, id }, { sel: selected });
};

const showHover = ({ line, path }: { line: LapLine; path: [number, number][] | null }) => {
  const source = line.map.getSource<GeoJSONSource>(terrainLineHoverSourceId(line.sourceId));
  source?.setData(terrainHoverLine(path));
};

const previewLapIndex = (state: MapControlsState): number | null => {
  if (state.hoveredLapIndex === state.selectedLapIndex) return null;
  return state.hoveredLapIndex;
};

const syncSelected = ({
  line,
  shown,
  state,
}: {
  line: LapLine;
  shown: ShownLaps;
  state: MapControlsState;
}) => {
  const spans = state.sessionLaps?.spans;
  if (spans === shown.spans && state.selectedLapIndex === shown.selected) return;
  markSelected({ line, runIds: shown.selectedRunIds, selected: false });
  const bounds = lapBounds({ line, spans, lapIndex: state.selectedLapIndex });
  shown.selectedRunIds = [];
  if (bounds !== null)
    shown.selectedRunIds = terrainLineRunIdsWithin({ runs: line.runs, ...bounds });
  markSelected({ line, runIds: shown.selectedRunIds, selected: true });
  shown.selected = state.selectedLapIndex;
};

const syncPreview = ({
  line,
  shown,
  state,
}: {
  line: LapLine;
  shown: ShownLaps;
  state: MapControlsState;
}) => {
  const spans = state.sessionLaps?.spans;
  const preview = previewLapIndex(state);
  if (spans === shown.spans && preview === shown.preview) return;
  const bounds = lapBounds({ line, spans, lapIndex: preview });
  showHover({ line, path: bounds && line.detailPath.path.slice(bounds.first, bounds.last + 1) });
  shown.preview = preview;
};

const syncLaps = ({
  line,
  shown,
  state,
}: {
  line: LapLine;
  shown: ShownLaps;
  state: MapControlsState;
}) => {
  syncSelected({ line, shown, state });
  syncPreview({ line, shown, state });
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
    syncLaps({ line, shown, state: useMapControlsStore.getState() });
    const unsubscribe = useMapControlsStore.subscribe((state) => syncLaps({ line, shown, state }));
    return () => {
      unsubscribe();
      markSelected({ line, runIds: shown.selectedRunIds, selected: false });
      showHover({ line, path: null });
    };
  }, [map, sourceId, detailPath, runs]);
};
