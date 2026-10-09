import type { SessionRecord } from '@/packages/engine/types.ts';
import { calculateGAP, calculateNormalizedPower } from '@/packages/engine/normalize.ts';
import { climbingRate } from '@/packages/engine/climbs.ts';
import { movingSeconds } from './movingTime.ts';
import { summarizeValues } from './seriesSummary.ts';
import type { SessionTerrain } from './sessionTerrain.ts';
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
  vam: number | undefined;
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

export const computeRangeStats = (
  records: SessionRecord[],
  range: RailRange,
  terrain: SessionTerrain,
): RangeStats => {
  const allMoving = movingSeconds(records);
  const inRange: SessionRecord[] = [];
  const gradients: Array<number | undefined> = [];
  const moving: number[] = [];
  let firstIndex: number | undefined = undefined;
  let lastIndex: number | undefined = undefined;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const seconds = allMoving[i] ?? 0;
    const minutes = seconds / 60;
    if (!record || minutes < range.from || minutes > range.to) continue;
    firstIndex ??= i;
    lastIndex = i;
    inRange.push(record);
    gradients.push(terrain.gradients[i]);
    moving.push(seconds);
  }

  let vam: number | undefined = undefined;
  if (firstIndex !== undefined && lastIndex !== undefined) {
    vam = climbingRate(records, terrain.climbs, firstIndex, lastIndex);
  }

  const hr = summarizeValues(inRange.map((r) => r.hr));
  const power = summarizeValues(inRange.map((r) => r.power));
  const speed = summarizeValues(inRange.map((r) => r.speed));
  const cadence = summarizeValues(inRange.map((r) => r.cadence));
  const grade = summarizeValues(
    gradients.map((gradient) => {
      if (gradient === undefined) return undefined;
      return gradient * 100;
    }),
  );
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
    gapSecPerKm: calculateGAP(inRange, gradients),
    vam,
  };
};
