// Sources: [LiangBarsky1984]
// See packages/engine/SOURCES.md for full citations.

import type { GPSPoint, GPSBounds } from './types.ts';

interface ParameterRange {
  minFraction: number;
  maxFraction: number;
}

const CLUSTER_RADIUS_DEGREES = 0.25;

const boundsCenter = (bounds: GPSBounds): GPSPoint => ({
  lat: (bounds.minLat + bounds.maxLat) / 2,
  lng: (bounds.minLng + bounds.maxLng) / 2,
});

const scaledDistanceDegrees = ({ from, to }: { from: GPSPoint; to: GPSPoint }): number => {
  const dLat = from.lat - to.lat;
  const dLng = (from.lng - to.lng) * Math.cos(((from.lat + to.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const extentOf = (extents: Iterable<GPSBounds>): GPSBounds => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const extent of extents) {
    if (extent.minLat < minLat) minLat = extent.minLat;
    if (extent.maxLat > maxLat) maxLat = extent.maxLat;
    if (extent.minLng < minLng) minLng = extent.minLng;
    if (extent.maxLng > maxLng) maxLng = extent.maxLng;
  }
  return { minLat, maxLat, minLng, maxLng };
};

export const boundsFromPoints = (points: GPSPoint[]): GPSBounds =>
  extentOf(
    points.map((point) => ({
      minLat: point.lat,
      maxLat: point.lat,
      minLng: point.lng,
      maxLng: point.lng,
    })),
  );

export const hasBoundsOverlap = ({
  first,
  second,
}: {
  first: GPSBounds;
  second: GPSBounds;
}): boolean =>
  first.minLat <= second.maxLat &&
  first.maxLat >= second.minLat &&
  first.minLng <= second.maxLng &&
  first.maxLng >= second.minLng;

export const unionBounds = (boundsArray: GPSBounds[]): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  return extentOf(boundsArray);
};

const clipEdge = ({
  direction,
  distance,
  range,
}: {
  direction: number;
  distance: number;
  range: ParameterRange;
}): ParameterRange | undefined => {
  if (direction === 0) {
    if (distance < 0) return undefined;
    return range;
  }
  const fraction = distance / direction;
  if (direction < 0) {
    if (fraction > range.maxFraction) return undefined;
    if (fraction > range.minFraction)
      return { minFraction: fraction, maxFraction: range.maxFraction };
    return range;
  }
  if (fraction < range.minFraction) return undefined;
  if (fraction < range.maxFraction)
    return { minFraction: range.minFraction, maxFraction: fraction };
  return range;
};

export const isSegmentIntersectingBounds = ({
  from,
  to,
  bounds,
}: {
  from: [number, number];
  to: [number, number];
  bounds: GPSBounds;
}): boolean => {
  const deltaLngDegrees = to[0] - from[0];
  const deltaLatDegrees = to[1] - from[1];

  const directions = [-deltaLngDegrees, deltaLngDegrees, -deltaLatDegrees, deltaLatDegrees];
  const distances = [
    from[0] - bounds.minLng,
    bounds.maxLng - from[0],
    from[1] - bounds.minLat,
    bounds.maxLat - from[1],
  ];

  let range: ParameterRange = { minFraction: 0, maxFraction: 1 };
  for (let i = 0; i < 4; i++) {
    const clipped = clipEdge({ direction: directions[i] ?? 0, distance: distances[i] ?? 0, range });
    if (!clipped) return false;
    range = clipped;
  }

  return range.minFraction <= range.maxFraction;
};

export const densestClusterBounds = (boundsArray: GPSBounds[]): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  const first = boundsArray[0];
  if (boundsArray.length === 1 && first) return first;

  const centers = boundsArray.map((bounds) => boundsCenter(bounds));

  let bestIndex = 0;
  let bestCount = 0;

  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    if (!center) continue;
    let count = 0;
    for (let j = 0; j < centers.length; j++) {
      const other = centers[j];
      if (!other) continue;
      if (i !== j && scaledDistanceDegrees({ from: center, to: other }) <= CLUSTER_RADIUS_DEGREES)
        count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestIndex = i;
    }
  }

  const seed = centers[bestIndex];
  if (!seed) return null;
  const cluster = boundsArray.filter((_, index) => {
    const candidateCenter = centers[index];
    if (!candidateCenter) return false;
    return scaledDistanceDegrees({ from: seed, to: candidateCenter }) <= CLUSTER_RADIUS_DEGREES;
  });
  return unionBounds(cluster);
};
