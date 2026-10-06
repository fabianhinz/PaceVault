import type { SessionRecord } from '@/packages/engine/types.ts';

export const STOP_CUTOFF_SEC = 30;
const STOP_GAP_FACTOR = 2;
const STOP_DISTANCE_M = 1;

const medianStep = (records: SessionRecord[]): number => {
  const steps: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const current = records[i];
    const previous = records[i - 1];
    if (!current || !previous) continue;
    const step = current.timestamp - previous.timestamp;
    if (step > 0) steps.push(step);
  }
  if (steps.length === 0) return 0;
  steps.sort((a, b) => a - b);
  return steps[Math.floor(steps.length / 2)] ?? 0;
};

const timerPause = (current: SessionRecord, previous: SessionRecord, step: number): number => {
  if (current.timerTime === undefined || previous.timerTime === undefined) return 0;
  return Math.max(0, step - (current.timerTime - previous.timerTime));
};

const standingGap = (
  current: SessionRecord,
  previous: SessionRecord,
  step: number,
  typical: number,
): number => {
  if (step <= typical * STOP_GAP_FACTOR) return 0;
  if (current.distance === undefined || previous.distance === undefined) return 0;
  if (current.distance - previous.distance >= STOP_DISTANCE_M) return 0;
  return step;
};

export const movingSeconds = (records: SessionRecord[]): number[] => {
  const typical = medianStep(records);
  const result: number[] = [];
  let moving = 0;
  records.forEach((current, i) => {
    const previous = records[i - 1];
    if (previous) {
      const step = current.timestamp - previous.timestamp;
      const stop = Math.max(
        timerPause(current, previous, step),
        standingGap(current, previous, step, typical),
      );
      if (stop >= STOP_CUTOFF_SEC) {
        moving += Math.max(step - stop, typical);
      } else {
        moving += step;
      }
    }
    result.push(moving);
  });
  return result;
};
