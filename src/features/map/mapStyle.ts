import type { StyleSpecification, VectorSourceSpecification } from 'maplibre-gl';
import darkMatterStyleSpec from './darkMatter.style.json';
// TODO support voyager
// import voyagerStyleSpec from './voyager.style.json';

// TODO support voyager
export type MapStyleId = 'dark';

const TILE_URL =
  'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt';
const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
const SOURCE_MAXZOOM = 14;
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

const baseStyles = {
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
    ...baseStyles[id].spec,
    sources: { ...baseStyles[id].spec.sources, carto: cartoSource },
    sprite: withApiKey(baseStyles[id].spriteUrl),
    glyphs: withApiKey(GLYPHS_URL),
  };
};

export const styles: Record<MapStyleId, StyleSpecification> = {
  dark: createStyle('dark'),
  // TODO support voyager
  // voyager: createStyle('voyager'),
};
