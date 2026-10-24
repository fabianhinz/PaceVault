import { useEffect, useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type {
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
  MapSourceDataEvent,
} from 'maplibre-gl';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { pathBounds } from '../lapPath.ts';
import {
  EMPTY_TERRAIN_LINE,
  buildTerrainLineFeatures,
  terrainLineHoverSourceId,
  terrainLineLayerIds,
  terrainLineWidthExpression,
  type LineColor,
  type TerrainLineRun,
} from '../terrainLine.ts';

interface TerrainLineWidths {
  metres: number;
  minPixels: number;
  casingMetres: number;
  casingMinPixels: number;
  selectedMinPixels: number;
}

const HOVER_WIDTH_PX = 3;
const ROUND_LINE = { 'line-join': 'round', 'line-cap': 'round' } as const;

type LineOpacity = NonNullable<
  Extract<LayerSpecification, { type: 'line' }>['paint']
>['line-opacity'];

const SELECTED_OPACITY: LineOpacity = ['case', ['boolean', ['feature-state', 'sel'], false], 1, 0];

const pathLatitude = (path: [number, number][]): number => {
  const bounds = pathBounds(path);
  if (bounds === null) return 0;
  return (bounds.minLat + bounds.maxLat) / 2;
};

const addTerrainLine = (map: MapLibreMap, id: string) => {
  const layers = terrainLineLayerIds(id);
  map.addSource(id, { type: 'geojson', tolerance: 0, data: EMPTY_TERRAIN_LINE });
  map.addSource(terrainLineHoverSourceId(id), {
    type: 'geojson',
    tolerance: 0,
    data: EMPTY_TERRAIN_LINE,
  });
  map.addLayer({
    id: layers.line,
    type: 'line',
    source: id,
    layout: ROUND_LINE,
    paint: { 'line-color': ['get', 'c'] },
  });
  map.addLayer({
    id: layers.hover,
    type: 'line',
    source: terrainLineHoverSourceId(id),
    layout: ROUND_LINE,
    paint: { 'line-color': tokens.mapHighlight, 'line-width': HOVER_WIDTH_PX },
  });
  map.addLayer({
    id: layers.casing,
    type: 'line',
    source: id,
    layout: ROUND_LINE,
    paint: { 'line-color': tokens.mapHighlight, 'line-opacity': SELECTED_OPACITY },
  });
  map.addLayer({
    id: layers.selected,
    type: 'line',
    source: id,
    layout: ROUND_LINE,
    paint: { 'line-color': ['get', 'c'], 'line-opacity': SELECTED_OPACITY },
  });
};

const removeTerrainLine = (map: MapLibreMap, id: string) => {
  for (const layerId of Object.values(terrainLineLayerIds(id))) {
    if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId);
  }
  for (const sourceId of [id, terrainLineHoverSourceId(id)]) {
    if (map.getSource(sourceId) !== undefined) map.removeSource(sourceId);
  }
};

const paintWidths = ({
  map,
  id,
  width,
  latitude,
}: {
  map: MapLibreMap;
  id: string;
  width: TerrainLineWidths;
  latitude: number;
}) => {
  const layers = terrainLineLayerIds(id);
  const widthOf = (metres: number, minPixels: number) =>
    terrainLineWidthExpression({ metres, minPixels, latitude });
  map.setPaintProperty(layers.line, 'line-width', widthOf(width.metres, width.minPixels));
  map.setPaintProperty(
    layers.casing,
    'line-width',
    widthOf(width.casingMetres, width.casingMinPixels),
  );
  map.setPaintProperty(
    layers.selected,
    'line-width',
    widthOf(width.metres, Math.max(width.selectedMinPixels, width.minPixels)),
  );
};

const whenLineRendered = ({
  map,
  id,
  onDrawn,
}: {
  map: MapLibreMap;
  id: string;
  onDrawn: () => void;
}): (() => void) => {
  const onRender = () => onDrawn();
  const onData = (event: MapSourceDataEvent) => {
    if (event.sourceId !== id || map.getSource(id) === undefined) return;
    if (!map.isSourceLoaded(id)) return;
    map.off('sourcedata', onData);
    map.once('render', onRender);
  };
  map.on('sourcedata', onData);
  return () => {
    map.off('sourcedata', onData);
    map.off('render', onRender);
  };
};

const lineColorProperty = (dimmed: boolean): 'c' | 'd' => {
  if (dimmed) return 'd';
  return 'c';
};

export const useTerrainLineEffect = ({
  id,
  path,
  runs,
  colors,
  width,
  dimFactor,
  dimmed,
  onDrawn,
}: {
  id: string;
  path: [number, number][];
  runs: TerrainLineRun[];
  colors: LineColor | LineColor[];
  width: TerrainLineWidths;
  dimFactor: number;
  dimmed: boolean;
  onDrawn?: () => void;
}): void => {
  const map = useMap().current?.getMap();
  const latitude = useMemo(() => pathLatitude(path), [path]);

  useEffect(() => {
    if (map === undefined) return;
    addTerrainLine(map, id);
    return () => removeTerrainLine(map, id);
  }, [map, id]);

  useEffect(() => {
    const source = map?.getSource<GeoJSONSource>(id);
    if (source === undefined) return;
    source.setData(buildTerrainLineFeatures({ path, runs, colors, dimFactor }));
  }, [map, id, path, runs, colors, dimFactor]);

  useEffect(() => {
    if (map === undefined || onDrawn === undefined || map.getSource(id) === undefined) return;
    if (runs.length === 0) {
      onDrawn();
      return;
    }
    return whenLineRendered({ map, id, onDrawn });
  }, [map, id, runs, onDrawn]);

  useEffect(() => {
    if (map === undefined) return;
    paintWidths({ map, id, width, latitude });
  }, [map, id, width, latitude]);

  useEffect(() => {
    if (map === undefined) return;
    map.setPaintProperty(terrainLineLayerIds(id).line, 'line-color', [
      'get',
      lineColorProperty(dimmed),
    ]);
  }, [map, id, dimmed]);
};
