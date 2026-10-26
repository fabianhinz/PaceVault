import { groupBySegment, segmentGradients } from './routeGeometry.ts';
import type { RoutePoint } from './types.ts';

interface RouteProfilePoint {
  distanceMeters: number;
  lng: number;
  lat: number;
}

interface RouteElevationPoint extends RouteProfilePoint {
  elevationMeters: number;
}

interface RouteGradePoint extends RouteProfilePoint {
  gradePercent: number | undefined;
}

export interface RouteProfile {
  elevation: RouteElevationPoint[];
  grade: RouteGradePoint[];
}

export const buildRouteProfile = (points: RoutePoint[]): RouteProfile => {
  const elevation: RouteElevationPoint[] = [];
  const grade: RouteGradePoint[] = [];
  for (const segment of groupBySegment(points)) {
    const gradients = segmentGradients(segment);
    segment.forEach((point, i) => {
      if (point.ele === undefined) return;
      const gradient = gradients[i];
      let gradePercent: number | undefined = undefined;
      if (gradient !== undefined) gradePercent = gradient * 100;
      elevation.push({
        distanceMeters: point.dist,
        elevationMeters: point.ele,
        lng: point.lng,
        lat: point.lat,
      });
      grade.push({
        distanceMeters: point.dist,
        gradePercent,
        lng: point.lng,
        lat: point.lat,
      });
    });
  }
  return { elevation, grade };
};
