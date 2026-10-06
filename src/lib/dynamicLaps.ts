import type { SessionRecord } from '@/packages/engine/types.ts';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { LapSpan } from '@/lib/lapRanges.ts';
import type { LapAnalysis, LapRecordEnrichment } from './laps.ts';
import { enrichLapFromRecords } from './laps.ts';

export const SPLIT_DISTANCES_M = [400, 1000, 2000, 5000] as const;

export type SplitDistance = (typeof SPLIT_DISTANCES_M)[number];

export interface DynamicLapResult {
  analysis: LapAnalysis[];
  enrichments: LapRecordEnrichment[];
  spans: LapSpan[];
}

const roundedAverage = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

const maxOf = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  return Math.max(...values);
};

const elevationGainOf = (slice: SessionRecord[]): number => {
  let gain = 0;
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1]?.elevation;
    const curr = slice[i]?.elevation;
    if (prev !== undefined && curr !== undefined && curr > prev) {
      gain += curr - prev;
    }
  }
  return gain;
};

export const computeDynamicLaps = (
  records: SessionRecord[],
  splitDistanceMetres: number,
): DynamicLapResult => {
  const withDistance: number[] = [];
  records.forEach((record, i) => {
    if (record.distance !== undefined) withDistance.push(i);
  });
  const empty: DynamicLapResult = { analysis: [], enrichments: [], spans: [] };
  const firstIndex = withDistance[0];
  if (withDistance.length < 2 || firstIndex === undefined) return empty;
  const firstDistance = records[firstIndex]?.distance;
  if (firstDistance === undefined) return empty;

  const moving = movingSeconds(records);
  const analysis: LapAnalysis[] = [];
  const enrichments: LapRecordEnrichment[] = [];
  const spans: LapSpan[] = [];
  let lapIndex = 0;

  const closeLap = (startPos: number, endPos: number, isPartial: boolean) => {
    const indices = withDistance.slice(startPos, endPos + 1);
    const slice = indices.map((i) => records[i]).filter((r): r is SessionRecord => r !== undefined);
    const startRecord = indices[0];
    const endRecord = indices[indices.length - 1];
    if (slice.length < 2 || startRecord === undefined || endRecord === undefined) return;

    const first = slice[0];
    const last = slice[slice.length - 1];
    const movingStart = moving[startRecord];
    const movingEnd = moving[endRecord];
    if (!first || !last || movingStart === undefined || movingEnd === undefined) return;
    if (first.distance === undefined || last.distance === undefined) return;

    const distance = last.distance - first.distance;
    const duration = last.timestamp - first.timestamp;
    const movingTime = movingEnd - movingStart;

    let paceSecPerKm: number | undefined = undefined;
    if (distance > 0 && movingTime > 0) {
      paceSecPerKm = (movingTime / distance) * 1000;
    }

    const hrs = slice.map((r) => r.hr).filter((h): h is number => h !== undefined);
    const cadences = slice.map((r) => r.cadence).filter((c): c is number => c !== undefined);
    const speeds = slice.map((r) => r.speed).filter((s): s is number => s !== undefined);

    analysis.push({
      lapIndex,
      paceSecPerKm,
      avgHr: roundedAverage(hrs),
      minHr: undefined,
      maxHr: maxOf(hrs),
      avgCadence: roundedAverage(cadences),
      distance,
      duration,
      movingTime,
      elevationGain: elevationGainOf(slice),
      intensity: 'active',
      maxSpeed: maxOf(speeds),
      isInterval: false,
      isPartial,
    });
    enrichments.push(enrichLapFromRecords(lapIndex, slice));
    spans.push({ lapIndex, startRecord, endRecord });
    lapIndex++;
  };

  let lapStart = 0;
  let nextBoundary = firstDistance + splitDistanceMetres;
  withDistance.forEach((recordIndex, pos) => {
    const d = records[recordIndex]?.distance;
    if (d === undefined || d < nextBoundary) return;
    closeLap(lapStart, pos, false);
    lapStart = pos;
    const crossed = Math.floor((d - firstDistance) / splitDistanceMetres);
    nextBoundary = firstDistance + (crossed + 1) * splitDistanceMetres;
  });

  if (lapStart < withDistance.length - 1) {
    closeLap(lapStart, withDistance.length - 1, true);
  }

  return { analysis, enrichments, spans };
};
