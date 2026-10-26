import type { SessionRecord } from './types.ts';
import { isMovingPair } from './recordPairs.ts';

interface StepLength {
  lengthMeters: number;
  stepsPerMinute: number;
}

const STEPS_PER_STRIDE = 2;

export const stepsPerMinute = (strideCadence: number): number => strideCadence * STEPS_PER_STRIDE;

export const coastingSeconds = (records: SessionRecord[]): number | undefined => {
  if (!records.some((record) => record.power !== undefined)) return undefined;
  let durationSec = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current || !isMovingPair({ previous, current })) continue;
    if (current.power !== 0 && current.cadence !== 0) continue;
    durationSec += current.timestamp - previous.timestamp;
  }
  return durationSec;
};

export const stepLength = (records: SessionRecord[]): StepLength | undefined | null => {
  let distanceMeters = 0;
  let steps = 0;
  let movingSec = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current || current.cadence === undefined) continue;
    if (previous.distance === undefined || current.distance === undefined) continue;
    if (!isMovingPair({ previous, current })) continue;
    const distanceDeltaMeters = current.distance - previous.distance;
    if (distanceDeltaMeters < 0) continue;
    const elapsedSec = current.timestamp - previous.timestamp;
    distanceMeters += distanceDeltaMeters;
    steps += (stepsPerMinute(current.cadence) * elapsedSec) / 60;
    movingSec += elapsedSec;
  }
  if (movingSec === 0) return undefined;
  if (steps === 0) return null;
  return { lengthMeters: distanceMeters / steps, stepsPerMinute: (steps / movingSec) * 60 };
};
