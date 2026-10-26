// Sources: [Veness2019]
// See packages/engine/SOURCES.md for full citations.

import { degreesToRadians } from '@pacevault/engine/geodesy.ts';
import type { RoutePoint } from './types.ts';

interface RoutePosition {
  lat: number;
  lng: number;
}

const interpolateLinear = ({
  from,
  to,
  fraction,
}: {
  from: number;
  to: number;
  fraction: number;
}): number => from + (to - from) * fraction;

const interpolateKnown = ({
  from,
  to,
  fraction,
}: {
  from: number | undefined;
  to: number | undefined;
  fraction: number;
}): number | undefined => {
  if (from == null || to == null) return undefined;
  return interpolateLinear({ from, to, fraction });
};

const interpolatedPoint = ({
  before,
  after,
  distanceMeters,
}: {
  before: RoutePoint;
  after: RoutePoint;
  distanceMeters: number;
}): RoutePoint => {
  const fraction = (distanceMeters - before.dist) / (after.dist - before.dist);
  const point: RoutePoint = {
    lat: interpolateLinear({ from: before.lat, to: after.lat, fraction }),
    lng: interpolateLinear({ from: before.lng, to: after.lng, fraction }),
    seg: before.seg,
    dist: distanceMeters,
  };
  const ele = interpolateKnown({ from: before.ele, to: after.ele, fraction });
  if (ele != null) point.ele = ele;
  const time = interpolateKnown({ from: before.time, to: after.time, fraction });
  if (time != null) point.time = Math.round(time);
  return point;
};

const firstIndexAtOrAfter = ({
  points,
  distanceMeters,
}: {
  points: RoutePoint[];
  distanceMeters: number;
}): number => {
  let low = 0;
  let high = points.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    const point = points[middle];
    if (point && point.dist < distanceMeters) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
};

const interpolatedStart = ({
  points,
  startIndex,
  startMeters,
}: {
  points: RoutePoint[];
  startIndex: number;
  startMeters: number;
}): RoutePoint[] => {
  const startAt = points[startIndex];
  const beforeStart = points[startIndex - 1];
  if (startAt && beforeStart && startAt.dist > startMeters) {
    return [
      interpolatedPoint({ before: beforeStart, after: startAt, distanceMeters: startMeters }),
    ];
  }
  return [];
};

const closingPoint = ({
  points,
  endIndex,
  endMeters,
}: {
  points: RoutePoint[];
  endIndex: number;
  endMeters: number;
}): RoutePoint[] => {
  const endAt = points[endIndex];
  const beforeEnd = points[endIndex - 1];
  if (endAt && endAt.dist === endMeters) return [endAt];
  if (endAt && beforeEnd) {
    return [interpolatedPoint({ before: beforeEnd, after: endAt, distanceMeters: endMeters })];
  }
  return [];
};

export const pointAtRouteDistance = ({
  points,
  distanceMeters,
}: {
  points: RoutePoint[];
  distanceMeters: number;
}): RoutePoint | null => {
  const index = firstIndexAtOrAfter({ points, distanceMeters });
  const atOrAfter = points[index];
  if (!atOrAfter) return points[points.length - 1] ?? null;
  const before = points[index - 1];
  if (!before || atOrAfter.dist === distanceMeters) return atOrAfter;
  return interpolatedPoint({ before, after: atOrAfter, distanceMeters });
};

export const sliceRoute = ({
  points,
  startMeters,
  endMeters,
}: {
  points: RoutePoint[];
  startMeters: number;
  endMeters: number;
}): RoutePoint[] => {
  const last = points[points.length - 1];
  if (!last || endMeters <= startMeters) return [];

  const startIndex = firstIndexAtOrAfter({ points, distanceMeters: startMeters });
  let endIndex = firstIndexAtOrAfter({ points, distanceMeters: endMeters });
  if (endMeters >= last.dist) endIndex = points.length;

  return [
    ...interpolatedStart({ points, startIndex, startMeters }),
    ...points.slice(startIndex, endIndex),
    ...closingPoint({ points, endIndex, endMeters }),
  ];
};

/** @see [Veness2019] — equirectangular approximation. */
export const routeDistanceAtPosition = ({
  points,
  position,
}: {
  points: RoutePoint[];
  position: RoutePosition;
}): number | null => {
  const longitudeScale = Math.cos(degreesToRadians(position.lat));
  const positionX = position.lng * longitudeScale;
  const positionY = position.lat;

  let nearestDistanceSquared = Infinity;
  let nearestRouteDistanceMeters: number | null = null;

  for (let i = 0; i < points.length; i++) {
    const segmentEnd = points[i];
    if (!segmentEnd) continue;
    let segmentStart = points[i - 1];
    if (!segmentStart || segmentStart.seg !== segmentEnd.seg) segmentStart = segmentEnd;

    const startX = segmentStart.lng * longitudeScale;
    const startY = segmentStart.lat;
    const deltaX = segmentEnd.lng * longitudeScale - startX;
    const deltaY = segmentEnd.lat - startY;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;

    let fraction = 0;
    if (lengthSquared > 0) {
      fraction = Math.max(
        0,
        Math.min(
          1,
          ((positionX - startX) * deltaX + (positionY - startY) * deltaY) / lengthSquared,
        ),
      );
    }

    const offsetX = positionX - (startX + deltaX * fraction);
    const offsetY = positionY - (startY + deltaY * fraction);
    const distanceSquared = offsetX * offsetX + offsetY * offsetY;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestRouteDistanceMeters =
        segmentStart.dist + (segmentEnd.dist - segmentStart.dist) * fraction;
    }
  }

  return nearestRouteDistanceMeters;
};
