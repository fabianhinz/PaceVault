import { windowedGradients } from '../engine/gradient.ts';
import { groupBySegment, type RoutePoint } from './routeGeometry.ts';

interface RouteProfilePoint {
  dist: number;
  lng: number;
  lat: number;
}

interface RouteElevationPoint extends RouteProfilePoint {
  elevation: number;
}

interface RouteGradePoint extends RouteProfilePoint {
  grade: number | undefined;
}

export interface RouteProfile {
  elevation: RouteElevationPoint[];
  grade: RouteGradePoint[];
}

const roundKm = (meters: number): number => Math.round(meters) / 1000;
const round1 = (value: number): number => Math.round(value * 10) / 10;

export const buildRouteProfile = (points: RoutePoint[]): RouteProfile => {
  const elevation: RouteElevationPoint[] = [];
  const grade: RouteGradePoint[] = [];
  for (const segment of groupBySegment(points)) {
    const gradients = windowedGradients(
      segment.map((p) => ({ distance: p.dist, elevation: p.ele })),
    );
    segment.forEach((point, i) => {
      if (point.ele === undefined) return;
      const dist = roundKm(point.dist);
      const gradient = gradients[i];
      let percent: number | undefined = undefined;
      if (gradient !== undefined) percent = round1(gradient * 100);
      elevation.push({ dist, elevation: round1(point.ele), lng: point.lng, lat: point.lat });
      grade.push({ dist, grade: percent, lng: point.lng, lat: point.lat });
    });
  }
  return { elevation, grade };
};
