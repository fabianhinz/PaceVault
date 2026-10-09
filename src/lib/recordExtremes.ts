import type { SessionRecord } from '@/packages/engine/types.ts';

interface RecordExtremes {
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

export const computeRecordExtremes = (
  records: SessionRecord[],
  gradients: Array<number | undefined>,
): RecordExtremes => {
  let maxSpeed: number | undefined = undefined;
  let maxCadence: number | undefined = undefined;
  let maxGrade: number | undefined = undefined;
  let minGrade: number | undefined = undefined;

  records.forEach((r, i) => {
    if (r.speed !== undefined && r.speed > 0) maxSpeed = maxOf(maxSpeed, r.speed);
    if (r.cadence !== undefined) maxCadence = maxOf(maxCadence, r.cadence);
    const gradient = gradients[i];
    if (gradient !== undefined) {
      maxGrade = maxOf(maxGrade, gradient * 100);
      minGrade = minOf(minGrade, gradient * 100);
    }
  });

  let bestPaceSecPerKm: number | undefined = undefined;
  if (maxSpeed !== undefined) {
    bestPaceSecPerKm = 1000 / maxSpeed;
  }

  return { bestPaceSecPerKm, maxCadence, maxGrade, minGrade };
};
