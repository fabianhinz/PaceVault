import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { dimmedColor } from './lapPath.ts';

export type LineColor = [number, number, number, number];

type TerrainLineWidth = NonNullable<
  Extract<LayerSpecification, { type: 'line' }>['paint']
>['line-width'];

interface TerrainLineFeature {
  type: 'Feature';
  id: number;
  properties: { c: string; d: string; v: number; e: number };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

interface TerrainLineFeatureCollection {
  type: 'FeatureCollection';
  features: TerrainLineFeature[];
}

interface TerrainHoverFeature {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

export interface TerrainLineRun {
  first: number;
  last: number;
}

const METRES_PER_PIXEL_AT_ZOOM_0 = 78271.517;
const MAX_LINE_ZOOM = 22;
const ZOOM_STOP_GAP = 0.01;
const ALPHA_MAX = 255;
const ALPHA_DIGITS = 3;

export const EMPTY_TERRAIN_LINE: TerrainLineFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const toCss = (color: LineColor): string =>
  `rgba(${color[0]},${color[1]},${color[2]},${(color[3] / ALPHA_MAX).toFixed(ALPHA_DIGITS)})`;

const isColorList = (colors: LineColor | LineColor[]): colors is LineColor[] =>
  Array.isArray(colors[0]);

const colorAt = ({
  colors,
  vertex,
}: {
  colors: LineColor | LineColor[];
  vertex: number;
}): LineColor | undefined => {
  if (isColorList(colors)) return colors[vertex];
  return colors;
};

const dimmedLineColor = (color: LineColor, dimFactor: number): LineColor => {
  const dimmed = dimmedColor(color, dimFactor);
  if (isColorList(dimmed)) return color;
  return dimmed;
};

const isSameColor = (a: LineColor, b: LineColor): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

const isRunStart = ({
  colors,
  segment,
  breaks,
}: {
  colors: LineColor | LineColor[];
  segment: number;
  breaks: Set<number>;
}): boolean => {
  if (breaks.has(segment)) return true;
  const previous = colorAt({ colors, vertex: segment - 1 });
  const current = colorAt({ colors, vertex: segment });
  if (previous === undefined || current === undefined) return true;
  return !isSameColor(previous, current);
};

export const terrainLineRuns = ({
  path,
  colors,
  breaks,
}: {
  path: [number, number][];
  colors: LineColor | LineColor[];
  breaks: number[];
}): TerrainLineRun[] => {
  const cuts = new Set(breaks);
  const runs: TerrainLineRun[] = [];
  let current: TerrainLineRun | null = null;
  for (let segment = 0; segment < path.length - 1; segment++) {
    if (colorAt({ colors, vertex: segment }) === undefined) {
      current = null;
      continue;
    }
    if (current === null || isRunStart({ colors, segment, breaks: cuts })) {
      current = { first: segment, last: segment + 1 };
      runs.push(current);
      continue;
    }
    current.last = segment + 1;
  }
  return runs;
};

export const buildTerrainLineFeatures = ({
  path,
  runs,
  colors,
  dimFactor,
}: {
  path: [number, number][];
  runs: TerrainLineRun[];
  colors: LineColor | LineColor[];
  dimFactor: number;
}): TerrainLineFeatureCollection => {
  const features: TerrainLineFeature[] = [];
  runs.forEach((run, id) => {
    const color = colorAt({ colors, vertex: run.first });
    if (color === undefined) return;
    features.push({
      type: 'Feature',
      id,
      properties: {
        c: toCss(color),
        d: toCss(dimmedLineColor(color, dimFactor)),
        v: run.first,
        e: run.last,
      },
      geometry: { type: 'LineString', coordinates: path.slice(run.first, run.last + 1) },
    });
  });
  return { type: 'FeatureCollection', features };
};

export const terrainLineRunIdsWithin = ({
  runs,
  first,
  last,
}: {
  runs: TerrainLineRun[];
  first: number;
  last: number;
}): number[] => {
  const ids: number[] = [];
  runs.forEach((run, id) => {
    if (run.first >= first && run.last <= last) ids.push(id);
  });
  return ids;
};

export const terrainHoverLine = (
  path: [number, number][] | null,
): TerrainHoverFeature | TerrainLineFeatureCollection => {
  if (path === null || path.length < 2) return EMPTY_TERRAIN_LINE;
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path } };
};

export const terrainLineWidthExpression = ({
  metres,
  minPixels,
  latitude,
}: {
  metres: number;
  minPixels: number;
  latitude: number;
}): TerrainLineWidth => {
  const metresPerPixel = METRES_PER_PIXEL_AT_ZOOM_0 * Math.cos((latitude * Math.PI) / 180);
  const minZoom = Math.log2((metresPerPixel * minPixels) / metres);
  const clampedMinZoom = Math.min(MAX_LINE_ZOOM - ZOOM_STOP_GAP, Math.max(ZOOM_STOP_GAP, minZoom));
  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    0,
    minPixels,
    clampedMinZoom,
    minPixels,
    MAX_LINE_ZOOM,
    (metres * 2 ** MAX_LINE_ZOOM) / metresPerPixel,
  ];
};

export const nearestLineVertex = ({
  path,
  ranges,
  coordinate,
}: {
  path: [number, number][];
  ranges: TerrainLineRun[];
  coordinate: [number, number];
}): number | undefined => {
  const cosLat = Math.cos((coordinate[1] * Math.PI) / 180);
  let best: number | undefined = undefined;
  let bestDistance = Infinity;
  for (const range of ranges) {
    for (let vertex = range.first; vertex <= range.last; vertex++) {
      const point = path[vertex];
      if (point === undefined) continue;
      const distance = Math.hypot((point[0] - coordinate[0]) * cosLat, point[1] - coordinate[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = vertex;
      }
    }
  }
  return best;
};

const runOfFeature = (properties: unknown): TerrainLineRun | undefined => {
  if (typeof properties !== 'object' || properties === null) return undefined;
  if (!('v' in properties) || !('e' in properties)) return undefined;
  const first: unknown = properties.v;
  const last: unknown = properties.e;
  if (typeof first !== 'number' || typeof last !== 'number') return undefined;
  return { first, last };
};

export const pickTerrainLineVertex = ({
  map,
  layerId,
  point,
  radius,
  path,
}: {
  map: MapLibreMap;
  layerId: string;
  point: [number, number];
  radius: number;
  path: [number, number][];
}): number | undefined => {
  if (map.getLayer(layerId) === undefined) return undefined;
  const features = map.queryRenderedFeatures(
    [
      [point[0] - radius, point[1] - radius],
      [point[0] + radius, point[1] + radius],
    ],
    { layers: [layerId] },
  );
  const ranges: TerrainLineRun[] = [];
  for (const feature of features) {
    const run = runOfFeature(feature.properties);
    if (run !== undefined) ranges.push(run);
  }
  if (ranges.length === 0) return undefined;
  const pointer = map.unproject(point);
  return nearestLineVertex({ path, ranges, coordinate: [pointer.lng, pointer.lat] });
};

export const terrainLineHoverSourceId = (id: string): string => `${id}-hover-path`;

export const terrainLineLayerIds = (id: string) => ({
  line: `${id}-line`,
  hover: `${id}-hover`,
  casing: `${id}-casing`,
  selected: `${id}-selected`,
});
