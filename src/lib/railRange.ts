import type { SessionRecord } from '@/packages/engine/types.ts';
import { calculateGAP, calculateNormalizedPower } from '@/packages/engine/normalize.ts';
import { movingSeconds } from './movingTime.ts';
import { summarizeValues } from './seriesSummary.ts';
import type { LapBand } from './lapRanges.ts';

interface RailRange {
  from: number;
  to: number;
}

export interface RangeStats {
  avgHr: number | undefined;
  maxHr: number | undefined;
  avgPower: number | undefined;
  normalizedPower: number | undefined;
  avgSpeed: number | undefined;
  maxSpeed: number | undefined;
  avgCadence: number | undefined;
  maxCadence: number | undefined;
  elevationGain: number | undefined;
  elevationLoss: number | undefined;
  maxGrade: number | undefined;
  minGrade: number | undefined;
  avgPaceSecPerKm: number | undefined;
  bestPaceSecPerKm: number | undefined;
  gapSecPerKm: number | undefined;
}

export const activeRailRange = (
  zoomRange: RailRange | null,
  selectedLap: LapBand | undefined,
): RailRange | null => {
  if (zoomRange) return zoomRange;
  if (selectedLap) return { from: selectedLap.from, to: selectedLap.to };
  return null;
};

const elevationChange = (records: SessionRecord[]) => {
  let gain: number | undefined = undefined;
  let loss: number | undefined = undefined;
  let previous: number | undefined = undefined;
  for (const record of records) {
    if (record.elevation === undefined) continue;
    if (previous !== undefined) {
      const delta = record.elevation - previous;
      gain = (gain ?? 0) + Math.max(delta, 0);
      loss = (loss ?? 0) + Math.max(-delta, 0);
    }
    previous = record.elevation;
  }
  return { gain, loss };
};

const averageSpeed = (records: SessionRecord[], moving: number[]): number | undefined => {
  const withDistance = records.flatMap((record, i) => {
    if (record.distance === undefined) return [];
    return [{ distance: record.distance, moving: moving[i] ?? 0 }];
  });
  const first = withDistance[0];
  const last = withDistance[withDistance.length - 1];
  if (first && last && last.moving > first.moving) {
    return (last.distance - first.distance) / (last.moving - first.moving);
  }
  return summarizeValues(records.map((r) => r.speed)).avg;
};

const paceOf = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return 1000 / speed;
};

export const computeRangeStats = (records: SessionRecord[], range: RailRange): RangeStats => {
  const allMoving = movingSeconds(records);
  const inRange: SessionRecord[] = [];
  const moving: number[] = [];
  records.forEach((record, i) => {
    const seconds = allMoving[i] ?? 0;
    const minutes = seconds / 60;
    if (minutes < range.from || minutes > range.to) return;
    inRange.push(record);
    moving.push(seconds);
  });

  const hr = summarizeValues(inRange.map((r) => r.hr));
  const power = summarizeValues(inRange.map((r) => r.power));
  const speed = summarizeValues(inRange.map((r) => r.speed));
  const cadence = summarizeValues(inRange.map((r) => r.cadence));
  const grade = summarizeValues(inRange.map((r) => r.grade));
  const elevation = elevationChange(inRange);
  const avgSpeed = averageSpeed(inRange, moving);

  return {
    avgHr: hr.avg,
    maxHr: hr.max,
    avgPower: power.avg,
    normalizedPower: calculateNormalizedPower(inRange),
    avgSpeed,
    maxSpeed: speed.max,
    avgCadence: cadence.avg,
    maxCadence: cadence.max,
    elevationGain: elevation.gain,
    elevationLoss: elevation.loss,
    maxGrade: grade.max,
    minGrade: grade.min,
    avgPaceSecPerKm: paceOf(avgSpeed),
    bestPaceSecPerKm: paceOf(speed.max),
    gapSecPerKm: calculateGAP(inRange),
  };
};
