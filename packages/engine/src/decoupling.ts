import type { SessionRecord, Sport } from './types.ts';
import { activeDurationSec, isMovingPair } from './recordPairs.ts';
import { gradeAdjustedPaceFactor } from './normalizedEffort.ts';

type DecouplingRatio = 'powerHr' | 'gapHr' | 'speedHr';

export interface Decoupling {
  ratio: DecouplingRatio;
  firstHalf: number;
  secondHalf: number;
  pct: number;
}

interface CountedInterval {
  durationSec: number;
  output: number;
  hr: number;
}

interface RunInterval extends CountedInterval {
  gradient: number | undefined;
}

/** @see [Friel-Decoupling] */
export const DECOUPLING_WELL_PACED_PCT = 5;
export const DECOUPLING_SCALE_PCT = 10;
const DECOUPLING_MIN_SEC = 3600;
const MIN_GRADIENT_COVERAGE = 0.9;

const rideIntervals = (records: SessionRecord[]): CountedInterval[] => {
  const intervals: CountedInterval[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined || current.power === undefined) continue;
    const durationSec = activeDurationSec({ previous, current });
    if (durationSec === 0) continue;
    intervals.push({ durationSec, output: current.power, hr: current.hr });
  }
  return intervals;
};

const runIntervals = ({
  records,
  gradients,
}: {
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}): { ratio: DecouplingRatio; intervals: CountedInterval[] } => {
  const candidates: RunInterval[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    if (previous.distance === undefined || current.distance === undefined) continue;
    if (!isMovingPair({ previous, current })) continue;
    const distanceDeltaMeters = current.distance - previous.distance;
    if (distanceDeltaMeters < 0) continue;
    const durationSec = current.timestamp - previous.timestamp;
    candidates.push({
      durationSec,
      output: (distanceDeltaMeters / durationSec) * 60,
      hr: current.hr,
      gradient: gradients[i],
    });
  }

  const totalSec = candidates.reduce((sum, candidate) => sum + candidate.durationSec, 0);
  const gradedSec = candidates.reduce((sum, candidate) => {
    if (candidate.gradient === undefined) return sum;
    return sum + candidate.durationSec;
  }, 0);
  if (totalSec === 0 || gradedSec / totalSec < MIN_GRADIENT_COVERAGE) {
    return { ratio: 'speedHr', intervals: candidates };
  }

  const intervals: CountedInterval[] = [];
  for (const candidate of candidates) {
    if (candidate.gradient === undefined) continue;
    intervals.push({
      durationSec: candidate.durationSec,
      output: candidate.output * gradeAdjustedPaceFactor(candidate.gradient),
      hr: candidate.hr,
    });
  }
  return { ratio: 'gapHr', intervals };
};

const halfRatio = (intervals: CountedInterval[]): number | null => {
  let output = 0;
  let hr = 0;
  for (const interval of intervals) {
    output += interval.output * interval.durationSec;
    hr += interval.hr * interval.durationSec;
  }
  if (hr <= 0) return null;
  return output / hr;
};

const sportIntervals = ({
  records,
  sport,
  gradients,
}: {
  records: SessionRecord[];
  sport: Sport;
  gradients: Array<number | undefined>;
}): { ratio: DecouplingRatio; intervals: CountedInterval[] } => {
  switch (sport) {
    case 'cycling':
      return { ratio: 'powerHr', intervals: rideIntervals(records) };
    case 'running':
      return runIntervals({ records, gradients });
  }
};

const splitHalves = ({
  intervals,
  totalSec,
}: {
  intervals: CountedInterval[];
  totalSec: number;
}): { first: CountedInterval[]; second: CountedInterval[] } => {
  const first: CountedInterval[] = [];
  const second: CountedInterval[] = [];
  let countedSec = 0;
  for (const interval of intervals) {
    countedSec += interval.durationSec;
    if (countedSec <= totalSec / 2) {
      first.push(interval);
    } else {
      second.push(interval);
    }
  }
  return { first, second };
};

/** @see [Friel-Decoupling], [Strava2017] */
export const aerobicDecoupling = ({
  records,
  sport,
  gradients,
}: {
  records: SessionRecord[];
  sport: Sport;
  gradients: Array<number | undefined>;
}): Decoupling | undefined | null => {
  const sportSeries = sportIntervals({ records, sport, gradients });
  const ratio = sportSeries.ratio;
  const intervals = sportSeries.intervals;

  const totalSec = intervals.reduce((sum, interval) => sum + interval.durationSec, 0);
  if (totalSec < DECOUPLING_MIN_SEC) return undefined;

  const halves = splitHalves({ intervals, totalSec });

  const firstHalf = halfRatio(halves.first);
  const secondHalf = halfRatio(halves.second);
  if (firstHalf === null || secondHalf === null || firstHalf <= 0) return null;

  return {
    ratio,
    firstHalf,
    secondHalf,
    pct: ((firstHalf - secondHalf) / firstHalf) * 100,
  };
};
