import type {
  LayerSpecification,
  RasterDEMSourceSpecification,
  StyleSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import darkMatterStyleSpec from './darkMatter.style.json';
// TODO support voyager
// import voyagerStyleSpec from './voyager.style.json';

// TODO support voyager
type MapStyleId = 'dark';

const TILE_URL =
  'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt';
const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
const SOURCE_MAXZOOM = 14;
export const MAP_MAXZOOM = 20;
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> <a href="https://mapterhorn.com/attribution">&copy; Mapterhorn</a>';

const TERRAIN_DEM_URL = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';
const TERRAIN_DEM_TILE_SIZE = 512;
const TERRAIN_DEM_MAXZOOM = 16;

type HillshadePaint = NonNullable<Extract<LayerSpecification, { type: 'hillshade' }>['paint']>;

export const terrainDemSource: RasterDEMSourceSpecification = {
  type: 'raster-dem',
  tiles: [TERRAIN_DEM_URL],
  encoding: 'terrarium',
  tileSize: TERRAIN_DEM_TILE_SIZE,
  maxzoom: TERRAIN_DEM_MAXZOOM,
};

export const TERRAIN_HILLSHADE_PAINT: HillshadePaint = {
  'hillshade-shadow-color': tokens.mapShadow,
  'hillshade-highlight-color': tokens.mapHillshadeHighlight,
  'hillshade-accent-color': tokens.mapShadow,
  'hillshade-exaggeration': 0.6,
};

const apiKey = import.meta.env.VITE_CARTO_API_KEY;
const withApiKey = (url: string) => {
  if (!apiKey) {
    return url;
  }
  return `${url}?key=${apiKey}`;
};

const cartoSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [withApiKey(TILE_URL)],
  minzoom: 0,
  maxzoom: SOURCE_MAXZOOM,
  attribution: ATTRIBUTION,
};

const BASE_STYLE_BY_MAP_STYLE = {
  dark: {
    spec: darkMatterStyleSpec as StyleSpecification,
    spriteUrl: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite',
  },
  // voyager: {
  //   spec: voyagerStyleSpec as StyleSpecification,
  //   spriteUrl: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/sprite',
  // },
} satisfies Record<MapStyleId, { spec: StyleSpecification; spriteUrl: string }>;

const createStyle = (id: MapStyleId): StyleSpecification => {
  return {
    ...BASE_STYLE_BY_MAP_STYLE[id].spec,
    sources: { ...BASE_STYLE_BY_MAP_STYLE[id].spec.sources, carto: cartoSource },
    sprite: withApiKey(BASE_STYLE_BY_MAP_STYLE[id].spriteUrl),
    glyphs: withApiKey(GLYPHS_URL),
  };
};

export const STYLE_BY_MAP_STYLE: Record<MapStyleId, StyleSpecification> = {
  dark: createStyle('dark'),
  // TODO support voyager
  // voyager: createStyle('voyager'),
};
