import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { TERRAIN_HILLSHADE_PAINT, terrainDemSource } from '@/components/mapBackground/mapStyle.ts';

const TERRAIN_SOURCE_ID = 'terrain-dem';
const HILLSHADE_SOURCE_ID = 'terrain-hillshade-dem';
const HILLSHADE_LAYER_ID = 'terrain-hillshade';
const TERRAIN_EXAGGERATION = 1;
const ROAD_SOURCE_LAYER = 'transportation';

const firstRoadLayerId = (map: MapLibreMap): string | undefined =>
  map
    .getStyle()
    .layers.find((layer) => 'source-layer' in layer && layer['source-layer'] === ROAD_SOURCE_LAYER)
    ?.id;

const removeTerrain = (map: MapLibreMap) => {
  map.setTerrain(null);
  if (map.getLayer(HILLSHADE_LAYER_ID) !== undefined) map.removeLayer(HILLSHADE_LAYER_ID);
  for (const sourceId of [HILLSHADE_SOURCE_ID, TERRAIN_SOURCE_ID]) {
    if (map.getSource(sourceId) !== undefined) map.removeSource(sourceId);
  }
};

export const useMapTerrainEffect = (): void => {
  const map = useMap().current?.getMap();

  useEffect(() => {
    if (map === undefined) return;
    map.addSource(TERRAIN_SOURCE_ID, terrainDemSource);
    map.addSource(HILLSHADE_SOURCE_ID, terrainDemSource);
    map.addLayer(
      {
        id: HILLSHADE_LAYER_ID,
        type: 'hillshade',
        source: HILLSHADE_SOURCE_ID,
        paint: TERRAIN_HILLSHADE_PAINT,
      },
      firstRoadLayerId(map),
    );
    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: TERRAIN_EXAGGERATION });
    return () => removeTerrain(map);
  }, [map]);
};
