import type { SessionRecord } from '@pacevault/engine/types.ts';

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

const timerPause = ({
  current,
  previous,
  step,
}: {
  current: SessionRecord;
  previous: SessionRecord;
  step: number;
}): number => {
  if (current.timerTime === undefined || previous.timerTime === undefined) return 0;
  return Math.max(0, step - (current.timerTime - previous.timerTime));
};

const standingGap = ({
  current,
  previous,
  step,
  typical,
}: {
  current: SessionRecord;
  previous: SessionRecord;
  step: number;
  typical: number;
}): number => {
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
        timerPause({ current, previous, step }),
        standingGap({ current, previous, step, typical }),
      );
      if (stop > 0) {
        moving += Math.max(step - stop, typical);
      } else {
        moving += step;
      }
    }
    result.push(moving);
  });
  return result;
};

export const sessionMovingTime = (
  records: SessionRecord[],
): { movingS: number; elapsedS: number } | undefined => {
  const first = records[0];
  const last = records[records.length - 1];
  if (records.length < 2 || !first || !last) return undefined;
  const moving = movingSeconds(records);
  return { movingS: moving[moving.length - 1] ?? 0, elapsedS: last.timestamp - first.timestamp };
};

export interface MovingClock {
  timestampsSec: number[];
  movingSec: number[];
}

export const movingClock = (records: SessionRecord[]): MovingClock => ({
  timestampsSec: records.map((record) => record.timestamp),
  movingSec: movingSeconds(records),
});

const firstIndexAtOrAfter = ({
  timestampsSec,
  timestampSec,
}: {
  timestampsSec: number[];
  timestampSec: number;
}): number => {
  let low = 0;
  let high = timestampsSec.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = timestampsSec[middle];
    if (candidate !== undefined && candidate < timestampSec) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
};

export const movingSecondsAt = ({
  clock,
  timestampSec,
}: {
  clock: MovingClock;
  timestampSec: number;
}): number | undefined => {
  const after = firstIndexAtOrAfter({ timestampsSec: clock.timestampsSec, timestampSec });
  const afterSec = clock.timestampsSec[after];
  const afterMoving = clock.movingSec[after];
  if (afterSec === undefined || afterMoving === undefined) return clock.movingSec.at(-1);
  const beforeSec = clock.timestampsSec[after - 1];
  const beforeMoving = clock.movingSec[after - 1];
  if (beforeSec === undefined || beforeMoving === undefined || afterSec === timestampSec) {
    return afterMoving;
  }
  const fraction = (timestampSec - beforeSec) / (afterSec - beforeSec);
  return beforeMoving + (afterMoving - beforeMoving) * fraction;
};
