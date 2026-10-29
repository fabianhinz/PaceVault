import { boundsFromPoints } from '@pacevault/engine/bounds.ts';
import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import type { GPSBounds } from '@pacevault/engine/types.ts';
import type { ParsedGpxPoint } from './parseGpx.ts';
import type { RoutePoint } from './types.ts';

export interface RouteElevationStats {
  gain: number;
  loss: number;
  min: number;
  max: number;
  maxGrade: number;
}

interface RouteGeometry {
  points: RoutePoint[];
  bounds: GPSBounds;
  distanceMeters: number;
  elevation?: RouteElevationStats;
}

const ELEVATION_HYSTERESIS_METERS = 3;

const steepestGradePercent = (points: RoutePoint[]): number => {
  let steepestPercent = 0;
  for (const segment of groupBySegment(points)) {
    for (const gradient of segmentGradients(segment)) {
      if (gradient !== undefined && gradient * 100 > steepestPercent)
        steepestPercent = gradient * 100;
    }
  }
  return steepestPercent;
};

const elevationStatsFromPoints = (points: RoutePoint[]): RouteElevationStats | undefined => {
  const elevatedPoints = points.filter(
    (point): point is RoutePoint & { ele: number } => point.ele !== undefined,
  );
  if (elevatedPoints.length < 2) return undefined;

  let minElevationMeters = Infinity;
  let maxElevationMeters = -Infinity;
  let gainMeters = 0;
  let lossMeters = 0;

  for (const segment of groupBySegment(elevatedPoints)) {
    const firstPoint = segment[0];
    if (!firstPoint) continue;
    let referenceElevationMeters = firstPoint.ele;

    for (const point of segment) {
      if (point.ele < minElevationMeters) minElevationMeters = point.ele;
      if (point.ele > maxElevationMeters) maxElevationMeters = point.ele;
      const elevationDeltaMeters = point.ele - referenceElevationMeters;
      if (elevationDeltaMeters >= ELEVATION_HYSTERESIS_METERS) {
        gainMeters += elevationDeltaMeters;
        referenceElevationMeters = point.ele;
      } else if (elevationDeltaMeters <= -ELEVATION_HYSTERESIS_METERS) {
        lossMeters += -elevationDeltaMeters;
        referenceElevationMeters = point.ele;
      }
    }
  }

  return {
    gain: gainMeters,
    loss: lossMeters,
    min: minElevationMeters,
    max: maxElevationMeters,
    maxGrade: steepestGradePercent(points),
  };
};

export const groupBySegment = <T extends { seg: number }>(points: T[]): T[][] => {
  const segments: T[][] = [];
  let segment: T[] = [];
  let segmentIndex: number | null = null;
  for (const point of points) {
    if (segmentIndex !== null && point.seg !== segmentIndex && segment.length > 0) {
      segments.push(segment);
      segment = [];
    }
    segmentIndex = point.seg;
    segment.push(point);
  }
  if (segment.length > 0) segments.push(segment);
  return segments;
};

export const segmentGradients = (segment: RoutePoint[]): Array<number | undefined> =>
  windowedGradients(segment.map((point) => ({ distance: point.dist, elevation: point.ele })));

export const buildRouteGeometry = (parsedPoints: ParsedGpxPoint[]): RouteGeometry | null => {
  if (parsedPoints.length < 2) return null;

  const points: RoutePoint[] = [];
  let distanceMeters = 0;
  let previous: ParsedGpxPoint | null = null;
  for (const point of parsedPoints) {
    if (previous && previous.seg === point.seg) {
      distanceMeters += haversineDistanceMeters({ from: previous, to: point });
    }
    points.push({ ...point, dist: distanceMeters });
    previous = point;
  }

  return {
    points,
    bounds: boundsFromPoints(points),
    distanceMeters,
    elevation: elevationStatsFromPoints(points),
  };
};
