import type { SessionRecord } from '@/packages/engine/types.ts';

export interface RecordExtremes {
  bestPaceSecPerKm: number | undefined;
  maxCadence: number | undefined;
  maxGrade: number | undefined;
  minGrade: number | undefined;
}

const maxOf = (current: number | undefined, value: number): number => {
  if (current === undefined || value > current) return value;
  return current;
};

const minOf = (current: number | undefined, value: number): number => {
  if (current === undefined || value < current) return value;
  return current;
};

export const computeRecordExtremes = (records: SessionRecord[]): RecordExtremes => {
  let maxSpeed: number | undefined = undefined;
  let maxCadence: number | undefined = undefined;
  let maxGrade: number | undefined = undefined;
  let minGrade: number | undefined = undefined;

  for (const r of records) {
    if (r.speed !== undefined && r.speed > 0) maxSpeed = maxOf(maxSpeed, r.speed);
    if (r.cadence !== undefined) maxCadence = maxOf(maxCadence, r.cadence);
    if (r.grade !== undefined) {
      maxGrade = maxOf(maxGrade, r.grade);
      minGrade = minOf(minGrade, r.grade);
    }
  }

  let bestPaceSecPerKm: number | undefined = undefined;
  if (maxSpeed !== undefined) {
    bestPaceSecPerKm = 1000 / maxSpeed;
  }

  return { bestPaceSecPerKm, maxCadence, maxGrade, minGrade };
};
