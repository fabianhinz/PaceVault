import type { SessionRecord } from '@/packages/engine/types.ts';
import { gradeAdjustedPaceFactor } from '@/packages/engine/normalize.ts';
import { filterValidPower } from '@/lib/validation.ts';

export interface TimeSeriesPoint {
  time: number;
}

export interface CadencePoint extends TimeSeriesPoint {
  cadence: number;
}

export interface ElevationPoint extends TimeSeriesPoint {
  elevation: number;
}

export interface GradePoint extends TimeSeriesPoint {
  grade: number;
}

export interface HrPoint extends TimeSeriesPoint {
  hr: number;
}

export interface PowerPoint extends TimeSeriesPoint {
  power: number;
}

export interface SpeedPoint extends TimeSeriesPoint {
  speed: number;
}

export interface PacePoint extends TimeSeriesPoint {
  pace: number;
}

export interface GAPPoint extends TimeSeriesPoint {
  pace: number;
  gap: number;
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

export const prepareHrData = (records: SessionRecord[]): HrPoint[] => {
  const result: HrPoint[] = [];
  for (const r of records) {
    if (r.hr !== undefined && r.hr > 0) {
      result.push({ time: toMinutes(r.timestamp), hr: Math.round(r.hr) });
    }
  }
  return result;
};

export const preparePowerData = (records: SessionRecord[]): PowerPoint[] => {
  const result: PowerPoint[] = [];
  for (const r of filterValidPower(records)) {
    if (r.power !== undefined) {
      result.push({ time: toMinutes(r.timestamp), power: Math.round(r.power) });
    }
  }
  return result;
};

export const prepareSpeedData = (records: SessionRecord[]): SpeedPoint[] => {
  const result: SpeedPoint[] = [];
  for (const r of records) {
    if (r.speed !== undefined && r.speed > 0) {
      result.push({ time: toMinutes(r.timestamp), speed: Math.round(r.speed * 3.6 * 10) / 10 });
    }
  }
  return result;
};

export const prepareCadenceData = (records: SessionRecord[]): CadencePoint[] => {
  const result: CadencePoint[] = [];
  for (const r of records) {
    if (r.cadence !== undefined && r.cadence > 0) {
      result.push({ time: toMinutes(r.timestamp), cadence: Math.round(r.cadence) });
    }
  }
  return result;
};

export const prepareElevationData = (records: SessionRecord[]): ElevationPoint[] => {
  const result: ElevationPoint[] = [];
  for (const r of records) {
    if (r.elevation !== undefined) {
      result.push({ time: toMinutes(r.timestamp), elevation: Math.round(r.elevation * 10) / 10 });
    }
  }
  return result;
};

export const prepareGradeData = (records: SessionRecord[]): GradePoint[] => {
  const result: GradePoint[] = [];
  for (const r of records) {
    if (r.grade !== undefined) {
      result.push({ time: toMinutes(r.timestamp), grade: Math.round(r.grade * 10) / 10 });
    }
  }
  return result;
};

/**
 * Convert speed (m/s) to pace (min/km).
 * Returns undefined for zero/negative speed.
 */
const speedToPace = (speed: number): number | undefined => {
  if (speed <= 0) return undefined;
  return 1000 / speed / 60; // min/km
};

export const preparePaceData = (records: SessionRecord[]): PacePoint[] => {
  const result: PacePoint[] = [];
  for (const r of records) {
    if (r.speed === undefined || r.speed <= 0.5) continue; // filter walking/standing
    const pace = speedToPace(r.speed);
    if (pace === undefined) continue;
    result.push({ time: toMinutes(r.timestamp), pace: Math.round(pace * 100) / 100 });
  }
  return result;
};

export const prepareGAPData = (records: SessionRecord[]): GAPPoint[] => {
  const valid = records.filter(
    (r) =>
      r.speed !== undefined &&
      r.speed > 0.5 &&
      (r.grade !== undefined || r.elevation !== undefined),
  );

  if (valid.length < 2) return [];

  const result: GAPPoint[] = [];
  for (let i = 0; i < valid.length; i++) {
    const r = valid[i];
    if (!r) continue;
    if (r.speed === undefined || r.speed <= 0.5) continue;
    const pace = speedToPace(r.speed);
    if (pace === undefined) continue;

    // grade from FIT is percentage (5 = 5%), factor expects fraction (0.05)
    let gradient: number;
    if (r.grade !== undefined) {
      gradient = r.grade / 100;
    } else if (i > 0 && r.elevation !== undefined) {
      const prev = valid[i - 1];
      const prevElevation = prev?.elevation;
      const dx = (r.distance ?? 0) - (prev?.distance ?? 0);
      gradient = 0;
      if (dx > 0 && prevElevation !== undefined) {
        gradient = (r.elevation - prevElevation) / dx;
      }
    } else {
      gradient = 0;
    }

    const factor = gradeAdjustedPaceFactor(gradient);
    const gap = pace / factor;

    result.push({
      time: toMinutes(r.timestamp),
      pace: Math.round(pace * 100) / 100,
      gap: Math.round(gap * 100) / 100,
    });
  }
  return result;
};
