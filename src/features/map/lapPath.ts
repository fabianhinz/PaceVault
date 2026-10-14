import type { LapSpan } from '@/lib/lapRanges.ts';
import type { DetailPath } from './zoneColoredPath.ts';
import type { GPSBounds } from '@/packages/engine/types.ts';

type Color = [number, number, number, number];

const isColorList = (color: Color | Color[]): color is Color[] => Array.isArray(color[0]);

const darken = (color: Color, factor: number): Color => [
  Math.round(color[0] * factor),
  Math.round(color[1] * factor),
  Math.round(color[2] * factor),
  color[3],
];

export const dimmedColor = (color: Color | Color[], factor: number): Color | Color[] => {
  if (isColorList(color)) return color.map((item) => darken(item, factor));
  return darken(color, factor);
};

export const nearestRecordIndex = (
  detail: DetailPath,
  coordinate: [number, number],
): number | undefined => {
  const cosLat = Math.cos((coordinate[1] * Math.PI) / 180);
  let best: number | undefined = undefined;
  let bestDistance = Infinity;
  detail.path.forEach((point, vertex) => {
    const dx = (point[0] - coordinate[0]) * cosLat;
    const dy = point[1] - coordinate[1];
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = detail.recordIndices[vertex];
    }
  });
  return best;
};

export const lapSubPath = (detail: DetailPath, span: LapSpan): DetailPath | null => {
  const first = detail.recordIndices.findIndex((index) => index >= span.startRecord);
  if (first < 0) return null;
  let end = detail.recordIndices.findIndex((index) => index > span.endRecord);
  if (end < 0) {
    end = detail.recordIndices.length;
  }
  if (end - first < 2) return null;
  let color = detail.color;
  if (isColorList(color)) {
    color = color.slice(first, end);
  }
  return {
    path: detail.path.slice(first, end),
    recordIndices: detail.recordIndices.slice(first, end),
    color,
  };
};

export const pathBounds = (path: [number, number][]): GPSBounds | null => {
  const first = path[0];
  if (!first) return null;
  let minLng = first[0];
  let maxLng = first[0];
  let minLat = first[1];
  let maxLat = first[1];
  for (const point of path) {
    minLng = Math.min(minLng, point[0]);
    maxLng = Math.max(maxLng, point[0]);
    minLat = Math.min(minLat, point[1]);
    maxLat = Math.max(maxLat, point[1]);
  }
  return { minLng, maxLng, minLat, maxLat };
};
