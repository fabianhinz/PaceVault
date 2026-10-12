import type { SessionRecord } from './types.ts';
import { isMovingPair } from './normalize.ts';

interface StepLength {
  metres: number;
  stepsPerMinute: number;
}

export const STEPS_PER_STRIDE = 2;

export const stepsPerMinute = (strideCadence: number): number => strideCadence * STEPS_PER_STRIDE;

export const coastingSeconds = (records: SessionRecord[]): number | undefined => {
  if (!records.some((r) => r.power !== undefined)) return undefined;
  let seconds = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current || !isMovingPair(previous, current)) continue;
    if (current.power !== 0 && current.cadence !== 0) continue;
    seconds += current.timestamp - previous.timestamp;
  }
  return seconds;
};

export const stepLength = (records: SessionRecord[]): StepLength | undefined | null => {
  let metres = 0;
  let steps = 0;
  let seconds = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current || current.cadence === undefined) continue;
    if (previous.distance === undefined || current.distance === undefined) continue;
    if (!isMovingPair(previous, current)) continue;
    const dx = current.distance - previous.distance;
    if (dx < 0) continue;
    const dt = current.timestamp - previous.timestamp;
    metres += dx;
    steps += (stepsPerMinute(current.cadence) * dt) / 60;
    seconds += dt;
  }
  if (seconds === 0) return undefined;
  if (steps === 0) return null;
  return { metres: metres / steps, stepsPerMinute: (steps / seconds) * 60 };
};
