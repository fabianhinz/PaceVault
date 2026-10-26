import type { ParsedGpxPoint } from './parseGpx.ts';

export interface RoutePoint extends ParsedGpxPoint {
  dist: number;
}
