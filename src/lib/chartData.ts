import type { SessionRecord } from '@/packages/engine/types.ts';
import { gradeAdjustedPaceFactor } from '@/packages/engine/normalize.ts';

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

export const filterSeriesByKey = <K extends string, T extends Record<K, number>>(
  data: T[],
  key: K,
  from: number,
  to: number,
): T[] => data.filter((d) => d[key] >= from && d[key] <= to);

export const filterTimeSeries = <T extends TimeSeriesPoint>(
  data: T[],
  from: number,
  to: number,
): T[] => filterSeriesByKey(data, 'time', from, to);

export const toMinutes = (timestamp: number): number => Math.round((timestamp / 60) * 100) / 100;

export const buildTimeToGpsLookup = (records: SessionRecord[]): Map<number, [number, number]> => {
  const map = new Map<number, [number, number]>();
  for (const r of records) {
    if (r.lat != null && r.lng != null) {
      map.set(toMinutes(r.timestamp), [r.lng, r.lat]);
    }
  }
  return map;
};

const roundTo = (value: number | undefined, factor: number): number | null => {
  if (value === undefined) return null;
  return Math.round(value * factor) / factor;
};

export const prepareHrData = (records: SessionRecord[]): HrPoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), hr: roundTo(r.hr, 1) }));

export const preparePowerData = (records: SessionRecord[]): PowerPoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), power: roundTo(r.power, 1) }));

export const prepareSpeedData = (records: SessionRecord[]): SpeedPoint[] =>
  records.map((r) => {
    let speed: number | null = null;
    if (r.speed !== undefined) {
      speed = Math.round(r.speed * 3.6 * 10) / 10;
    }
    return { time: toMinutes(r.timestamp), speed };
  });

export const prepareCadenceData = (records: SessionRecord[]): CadencePoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), cadence: roundTo(r.cadence, 1) }));

export const prepareElevationData = (records: SessionRecord[]): ElevationPoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), elevation: roundTo(r.elevation, 10) }));

export const prepareGradeData = (records: SessionRecord[]): GradePoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), grade: roundTo(r.grade, 10) }));

const speedToPace = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return 1000 / speed / 60;
};

export const preparePaceData = (records: SessionRecord[]): PacePoint[] =>
  records.map((r) => ({ time: toMinutes(r.timestamp), pace: roundTo(speedToPace(r.speed), 100) }));

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

export const prepareGAPData = (records: SessionRecord[]): GAPPoint[] =>
  records.map((r, i) => {
    const pace = speedToPace(r.speed);
    const gradient = gradientAt(records, i);
    let gap: number | undefined = undefined;
    if (pace !== undefined && gradient !== undefined) {
      gap = pace / gradeAdjustedPaceFactor(gradient);
    }
    return { time: toMinutes(r.timestamp), pace: roundTo(pace, 100), gap: roundTo(gap, 100) };
  });

export const hasSeriesValues = <K extends string>(
  points: ReadonlyArray<Record<K, number | null>>,
  key: K,
): boolean => points.some((p) => p[key] !== null);
