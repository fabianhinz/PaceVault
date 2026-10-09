import type { SessionRecord } from '@/packages/engine/types.ts';
import type { RouteProfile } from '@/packages/gpx/routeProfile.ts';
import { gradeAdjustedPaceFactor } from '@/packages/engine/normalize.ts';
import { bucketSeries, TARGET_ROWS } from '@/lib/chartBuckets.ts';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { SessionTerrain } from '@/lib/sessionTerrain.ts';

interface TimeSeriesPoint {
  time: number;
}

export interface CadencePoint extends TimeSeriesPoint {
  cadence: number | null;
}

export interface HrPoint extends TimeSeriesPoint {
  hr: number | null;
}

export interface PowerPoint extends TimeSeriesPoint {
  power: number | null;
}

export interface SpeedPoint extends TimeSeriesPoint {
  speed: number | null;
}

export interface PacePoint extends TimeSeriesPoint {
  pace: number | null;
}

export interface GAPPoint extends TimeSeriesPoint {
  pace: number | null;
  gap: number | null;
}

const speedToPace = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return 1000 / speed / 60;
};

export const hasSeriesValues = <K extends string>(
  points: ReadonlyArray<Record<K, number | null>>,
  key: K,
): boolean => points.some((p) => p[key] !== null);

interface SessionChartRowOptions {
  isRunning: boolean;
  terrain: SessionTerrain;
  range?: { from: number; to: number };
}

export const buildSessionChartRows = (
  records: SessionRecord[],
  options: SessionChartRowOptions,
) => {
  const moving = movingSeconds(records);
  return bucketSeries(records, {
    xKey: 'time',
    x: (_, i) => (moving[i] ?? 0) / 60,
    channels: {
      hr: (r) => r.hr,
      power: (r) => r.power,
      speed: (r) => {
        if (r.speed === undefined) return undefined;
        return r.speed * 3.6;
      },
      cadence: (r) => r.cadence,
      elevation: (r) => r.elevation,
      climbElevation: (r, i) => {
        if (!options.terrain.inClimb[i]) return undefined;
        return r.elevation;
      },
      grade: (_, i) => {
        const gradient = options.terrain.gradients[i];
        if (gradient === undefined) return undefined;
        return gradient * 100;
      },
      pace: (r) => {
        if (!options.isRunning) return undefined;
        return speedToPace(r.speed);
      },
      gap: (r, i) => {
        if (!options.isRunning) return undefined;
        const pace = speedToPace(r.speed);
        const gradient = options.terrain.gradients[i];
        if (pace === undefined || gradient === undefined) return undefined;
        return pace / gradeAdjustedPaceFactor(gradient);
      },
    },
    range: options.range,
    targetRows: TARGET_ROWS,
  });
};

export const gpsByX = <K extends string>(
  rows: ReadonlyArray<Record<K, number> & { source: { lat?: number; lng?: number } | undefined }>,
  key: K,
): Map<number, [number, number]> => {
  const map = new Map<number, [number, number]>();
  for (const row of rows) {
    const lat = row.source?.lat;
    const lng = row.source?.lng;
    if (lat !== undefined && lng !== undefined) map.set(row[key], [lng, lat]);
  }
  return map;
};

export const buildRouteChartRows = (profile: RouteProfile, range?: { from: number; to: number }) =>
  bucketSeries(profile.elevation, {
    xKey: 'dist',
    x: (p) => p.dist,
    channels: {
      elevation: (p) => p.elevation,
      grade: (_, i) => profile.grade[i]?.grade,
    },
    range,
    targetRows: TARGET_ROWS,
    emptyBuckets: 'skip',
  });
