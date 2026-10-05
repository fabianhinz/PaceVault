import type { SessionRecord } from '@/packages/engine/types.ts';
import type { RouteProfile } from '@/packages/gpx/routeProfile.ts';
import { gradeAdjustedPaceFactor } from '@/packages/engine/normalize.ts';
import { bucketSeries, TARGET_ROWS } from '@/lib/chartBuckets.ts';

export interface TimeSeriesPoint {
  time: number;
}

export interface CadencePoint extends TimeSeriesPoint {
  cadence: number | null;
}

export interface ElevationPoint extends TimeSeriesPoint {
  elevation: number | null;
}

export interface GradePoint extends TimeSeriesPoint {
  grade: number | null;
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

const gradientAt = (records: SessionRecord[], i: number): number | undefined => {
  const r = records[i];
  if (!r) return undefined;
  if (r.grade !== undefined) return r.grade / 100;
  const prev = records[i - 1];
  if (
    !prev ||
    r.elevation === undefined ||
    prev.elevation === undefined ||
    r.distance === undefined ||
    prev.distance === undefined
  ) {
    return undefined;
  }
  const dx = r.distance - prev.distance;
  if (dx <= 0) return undefined;
  return (r.elevation - prev.elevation) / dx;
};

export const hasSeriesValues = <K extends string>(
  points: ReadonlyArray<Record<K, number | null>>,
  key: K,
): boolean => points.some((p) => p[key] !== null);

interface SessionChartRowOptions {
  isRunning: boolean;
  range?: { from: number; to: number };
}

export const buildSessionChartRows = (
  records: SessionRecord[],
  options: SessionChartRowOptions,
) => {
  const includeGap = options.isRunning && records.some((r) => r.grade !== undefined);
  return bucketSeries(records, {
    xKey: 'time',
    x: (r) => r.timestamp / 60,
    channels: {
      hr: (r) => r.hr,
      power: (r) => r.power,
      speed: (r) => {
        if (r.speed === undefined) return undefined;
        return r.speed * 3.6;
      },
      cadence: (r) => r.cadence,
      elevation: (r) => r.elevation,
      grade: (r) => r.grade,
      pace: (r) => {
        if (!options.isRunning) return undefined;
        return speedToPace(r.speed);
      },
      gap: (r, i) => {
        if (!includeGap) return undefined;
        const pace = speedToPace(r.speed);
        const gradient = gradientAt(records, i);
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
