import type {
  LayerSpecification,
  RasterDEMSourceSpecification,
  SkySpecification,
  StyleSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import darkMatterStyleSpec from './darkMatter.style.json';
import voyagerStyleSpec from './voyager.style.json';
import { MAP_THEME, type MapTheme } from './mapTheme.ts';

type MapStyleId = 'dark' | 'voyager';

const TILE_URL =
  'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt';
const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
const SOURCE_MAXZOOM = 14;
export const MAP_MAXZOOM = 20;
export const MAP_MAX_PITCH = 70;
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

// A light ground needs a softer relief: at the dark map's 0.6 the brown shadows turn muddy.
export const HILLSHADE_EXAGGERATION_BY_MAP_THEME: Record<MapTheme, number> = {
  dark: 0.6,
  light: 0.35,
};

export const TERRAIN_HILLSHADE_PAINT: HillshadePaint = {
  'hillshade-shadow-color': tokens.mapShadow,
  'hillshade-highlight-color': tokens.mapHillshadeHighlight,
  'hillshade-accent-color': tokens.mapShadow,
  'hillshade-exaggeration': HILLSHADE_EXAGGERATION_BY_MAP_THEME[MAP_THEME],
};

const SKY_HORIZON_BLEND = 0.5;
const HORIZON_FOG_BLEND = 0.6;
const FOG_GROUND_BLEND = 0.7;

/** The sky above a tilted 3D map, with fog thickening toward the horizon. */
export const TERRAIN_SKY: SkySpecification = {
  'sky-color': tokens.mapSky,
  'horizon-color': tokens.mapSkyHorizon,
  'fog-color': tokens.mapFog,
  'sky-horizon-blend': SKY_HORIZON_BLEND,
  'horizon-fog-blend': HORIZON_FOG_BLEND,
  'fog-ground-blend': FOG_GROUND_BLEND,
  'atmosphere-blend': 0,
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
  voyager: {
    spec: voyagerStyleSpec as StyleSpecification,
    spriteUrl: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/sprite',
  },
} satisfies Record<MapStyleId, { spec: StyleSpecification; spriteUrl: string }>;

const createStyle = (id: MapStyleId): StyleSpecification => {
  return {
    ...BASE_STYLE_BY_MAP_STYLE[id].spec,
    sources: { ...BASE_STYLE_BY_MAP_STYLE[id].spec.sources, carto: cartoSource },
    sprite: withApiKey(BASE_STYLE_BY_MAP_STYLE[id].spriteUrl),
    glyphs: withApiKey(GLYPHS_URL),
  };
};

const MAP_STYLE_ID_BY_MAP_THEME: Record<MapTheme, MapStyleId> = {
  dark: 'dark',
  light: 'voyager',
};

/** The basemap follows the app theme: CARTO Dark Matter in dark, CARTO Voyager in light. */
export const MAP_STYLE = createStyle(MAP_STYLE_ID_BY_MAP_THEME[MAP_THEME]);
