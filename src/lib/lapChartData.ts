import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { m } from '@/paraglide/messages.js';

export interface LapSplitPoint {
  lap: string;
  lapIndex: number;
  pace: number; // sec/km
  speed: number; // km/h
  maxPace: number; // sec/km (from max speed)
  maxSpeed: number; // km/h
  minPace: number | undefined; // sec/km (from min speed enrichment)
  minSpeed: number | undefined; // km/h
  paceRange: [number, number] | undefined; // [maxPace, minPace] (fast→slow for reversed axis)
  speedRange: [number, number] | undefined; // [minSpeed, maxSpeed]
}

export interface LapHrPoint {
  lap: string;
  lapIndex: number;
  avgHr: number;
  minHr: number;
  maxHr: number;
  hrRange: [number, number]; // [minHr, maxHr]
}

export interface LapPowerPoint {
  lap: string;
  lapIndex: number;
  avgPower: number;
  minPower: number;
  maxPower: number;
  powerRange: [number, number]; // [minPower, maxPower]
}

export const prepareLapSplitsData = (
  laps: LapAnalysis[],
  enrichments?: LapRecordEnrichment[],
): LapSplitPoint[] => {
  const enrichmentMap = new Map(enrichments?.map((e) => [e.lapIndex, e]));

  const result: LapSplitPoint[] = [];
  for (const l of laps) {
    if (l.paceSecPerKm === undefined || l.intensity !== 'active') continue;

    const pace = l.paceSecPerKm;
    const speed = Math.round((3600 / pace) * 10) / 10;

    let maxSpeedKmh = speed;
    if (l.maxSpeed !== undefined) {
      maxSpeedKmh = Math.round(l.maxSpeed * 3.6 * 10) / 10;
    }

    let maxPace = pace;
    if (l.maxSpeed !== undefined && l.maxSpeed > 0) {
      maxPace = 1000 / l.maxSpeed;
    }

    const enrichment = enrichmentMap.get(l.lapIndex);
    const minSpeedMs = enrichment?.minSpeed;

    let minSpeedKmh: number | undefined = undefined;
    if (minSpeedMs !== undefined) {
      minSpeedKmh = Math.round(minSpeedMs * 3.6 * 10) / 10;
    }

    let minPace: number | undefined = undefined;
    if (minSpeedMs !== undefined && minSpeedMs > 0) {
      minPace = 1000 / minSpeedMs;
    }

    let paceRange: [number, number] | undefined = undefined;
    if (minPace !== undefined) {
      paceRange = [maxPace, minPace];
    }

    let speedRange: [number, number] | undefined = undefined;
    if (minSpeedKmh !== undefined) {
      speedRange = [minSpeedKmh, maxSpeedKmh];
    }

    result.push({
      lap: m.ui_lap_label({ number: String(l.lapIndex + 1) }),
      lapIndex: l.lapIndex,
      pace,
      speed,
      maxPace,
      maxSpeed: maxSpeedKmh,
      minPace,
      minSpeed: minSpeedKmh,
      paceRange,
      speedRange,
    });
  }
  return result;
};

export const prepareLapPowerData = (enrichments: LapRecordEnrichment[]): LapPowerPoint[] => {
  const result: LapPowerPoint[] = [];
  for (const e of enrichments) {
    if (e.avgPower === undefined || e.minPower === undefined || e.maxPower === undefined) continue;
    result.push({
      lap: m.ui_lap_label({ number: String(e.lapIndex + 1) }),
      lapIndex: e.lapIndex,
      avgPower: e.avgPower,
      minPower: e.minPower,
      maxPower: e.maxPower,
      powerRange: [e.minPower, e.maxPower],
    });
  }
  return result;
};

export const prepareLapHrData = (
  laps: LapAnalysis[],
  enrichments?: LapRecordEnrichment[],
): LapHrPoint[] => {
  const enrichmentMap = new Map(enrichments?.map((e) => [e.lapIndex, e]));

  const result: LapHrPoint[] = [];
  for (const l of laps) {
    if (l.avgHr === undefined) continue;
    const avgHr = l.avgHr;
    const enrichment = enrichmentMap.get(l.lapIndex);
    const minHr = enrichment?.minHr ?? l.minHr ?? avgHr;
    const maxHr = l.maxHr ?? avgHr;
    result.push({
      lap: m.ui_lap_label({ number: String(l.lapIndex + 1) }),
      lapIndex: l.lapIndex,
      avgHr,
      minHr,
      maxHr,
      hrRange: [minHr, maxHr],
    });
  }
  return result;
};

export const lapIndexAt = (
  points: ReadonlyArray<{ lapIndex: number }>,
  activeIndex: number | string | null | undefined,
): number | null => {
  if (activeIndex === undefined || activeIndex === null) return null;
  const point = points[Number(activeIndex)];
  if (!point) return null;
  return point.lapIndex;
};
