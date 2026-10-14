import type { SessionRecord, Sport } from '@/packages/engine/types.ts';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { LapSpan } from '@/lib/lapRanges.ts';
import type { LapAnalysis } from './laps.ts';

interface SplitDistanceRange {
  min: number;
  max: number;
  step: number;
}

const SPLIT_RANGES: Record<Sport, SplitDistanceRange> = {
  running: { min: 500, max: 10_000, step: 500 },
  cycling: { min: 1000, max: 50_000, step: 1000 },
};

export const recordedDistance = (records: SessionRecord[]): number => {
  const first = records.find((record) => record.distance !== undefined)?.distance;
  const last = records.findLast((record) => record.distance !== undefined)?.distance;
  if (first === undefined || last === undefined) return 0;
  return Math.max(0, last - first);
};

export const splitDistanceRange = (sport: Sport, sessionMetres: number): SplitDistanceRange => {
  const range = SPLIT_RANGES[sport];
  const cap = Math.floor(sessionMetres / range.step) * range.step;
  const max = Math.max(range.min, Math.min(range.max, cap));
  return { min: range.min, max, step: range.step };
};

interface DynamicLapResult {
  analysis: LapAnalysis[];
  spans: LapSpan[];
}

export const computeDynamicLaps = (
  records: SessionRecord[],
  splitDistanceMetres: number,
): DynamicLapResult => {
  const withDistance: number[] = [];
  records.forEach((record, i) => {
    if (record.distance !== undefined) withDistance.push(i);
  });
  const empty: DynamicLapResult = { analysis: [], spans: [] };
  const firstIndex = withDistance[0];
  if (withDistance.length < 2 || firstIndex === undefined) return empty;
  const firstDistance = records[firstIndex]?.distance;
  if (firstDistance === undefined) return empty;

  const moving = movingSeconds(records);
  const analysis: LapAnalysis[] = [];
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
    const movingTime = movingEnd - movingStart;

    let paceSecPerKm: number | undefined = undefined;
    if (distance > 0 && movingTime > 0) {
      paceSecPerKm = (movingTime / distance) * 1000;
    }

    analysis.push({
      lapIndex,
      paceSecPerKm,
      distance,
      movingTime,
      intensity: 'active',
      isInterval: false,
      isPartial,
    });
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

  return { analysis, spans };
};
