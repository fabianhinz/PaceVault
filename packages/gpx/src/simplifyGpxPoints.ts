import { Simplify as simplify } from 'simplify-ts';
import type { GpxPoint } from './buildGpx.ts';

export const simplifyGpxPoints = (points: GpxPoint[], tolerance = 0.00005): GpxPoint[] => {
  if (points.length < 3) return points;

  const mapped = points.map((p) => ({ x: p.lon, y: p.lat }));
  const simplified = simplify(mapped, tolerance);
  const kept = new Set(simplified.map((s) => mapped.indexOf(s)));

  return points.filter((_, i) => kept.has(i));
};
