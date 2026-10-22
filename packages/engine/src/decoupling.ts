import type { SessionRecord, Sport } from './types.ts';
import { windowedGradients } from './gradient.ts';
import { activeSeconds, gradeAdjustedPaceFactor, isMovingPair } from './normalize.ts';

export type DecouplingRatio = 'powerHr' | 'gapHr' | 'speedHr';

export interface Decoupling {
  ratio: DecouplingRatio;
  firstHalf: number;
  secondHalf: number;
  pct: number;
}

/** @see [Friel-Decoupling] */
export const DECOUPLING_WELL_PACED_PCT = 5;
export const DECOUPLING_SCALE_PCT = 10;
export const DECOUPLING_MIN_SECONDS = 3600;
export const MIN_GRADIENT_COVERAGE = 0.9;

interface CountedInterval {
  seconds: number;
  output: number;
  hr: number;
}

interface RunInterval extends CountedInterval {
  gradient: number | undefined;
}

const rideIntervals = (records: SessionRecord[]): CountedInterval[] => {
  const intervals: CountedInterval[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined || current.power === undefined) continue;
    const seconds = activeSeconds(previous, current);
    if (seconds === 0) continue;
    intervals.push({ seconds, output: current.power, hr: current.hr });
  }
  return intervals;
};

const runIntervals = (
  records: SessionRecord[],
  gradients: Array<number | undefined>,
): { ratio: DecouplingRatio; intervals: CountedInterval[] } => {
  const candidates: RunInterval[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    if (previous.distance === undefined || current.distance === undefined) continue;
    if (!isMovingPair(previous, current)) continue;
    const dx = current.distance - previous.distance;
    if (dx < 0) continue;
    const seconds = current.timestamp - previous.timestamp;
    candidates.push({
      seconds,
      output: (dx / seconds) * 60,
      hr: current.hr,
      gradient: gradients[i],
    });
  }

  const totalSeconds = candidates.reduce((sum, c) => sum + c.seconds, 0);
  const gradedSeconds = candidates.reduce((sum, c) => {
    if (c.gradient === undefined) return sum;
    return sum + c.seconds;
  }, 0);
  if (totalSeconds === 0 || gradedSeconds / totalSeconds < MIN_GRADIENT_COVERAGE) {
    return { ratio: 'speedHr', intervals: candidates };
  }

  const intervals: CountedInterval[] = [];
  for (const c of candidates) {
    if (c.gradient === undefined) continue;
    intervals.push({
      seconds: c.seconds,
      output: c.output * gradeAdjustedPaceFactor(c.gradient),
      hr: c.hr,
    });
  }
  return { ratio: 'gapHr', intervals };
};

const halfRatio = (intervals: CountedInterval[]): number | null => {
  let output = 0;
  let hr = 0;
  for (const interval of intervals) {
    output += interval.output * interval.seconds;
    hr += interval.hr * interval.seconds;
  }
  if (hr <= 0) return null;
  return output / hr;
};

/** @see [Friel-Decoupling], [Strava2017] */
export const aerobicDecoupling = (
  records: SessionRecord[],
  sport: Sport,
  gradients: Array<number | undefined> = windowedGradients(records),
): Decoupling | undefined | null => {
  let ratio: DecouplingRatio = 'powerHr';
  let intervals: CountedInterval[] = [];
  if (sport === 'cycling') {
    intervals = rideIntervals(records);
  } else {
    const run = runIntervals(records, gradients);
    ratio = run.ratio;
    intervals = run.intervals;
  }

  const totalSeconds = intervals.reduce((sum, interval) => sum + interval.seconds, 0);
  if (totalSeconds < DECOUPLING_MIN_SECONDS) return undefined;

  const first: CountedInterval[] = [];
  const second: CountedInterval[] = [];
  let counted = 0;
  for (const interval of intervals) {
    counted += interval.seconds;
    if (counted <= totalSeconds / 2) {
      first.push(interval);
    } else {
      second.push(interval);
    }
  }

  const firstHalf = halfRatio(first);
  const secondHalf = halfRatio(second);
  if (firstHalf === null || secondHalf === null || firstHalf <= 0) return null;

  return {
    ratio,
    firstHalf,
    secondHalf,
    pct: ((firstHalf - secondHalf) / firstHalf) * 100,
  };
};
