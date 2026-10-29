import type { SessionRecord } from './types.ts';
import { windowedGradients } from './gradient.ts';
import { activeDurationSec, isMovingPair } from './recordPairs.ts';

/** @see [CogganAllen2010] */
const NP_ROLLING_WINDOW_SEC = 30;
/** @see [Strava2017] */
const GAP_GRADIENT_LIMIT = 0.3;
/** @see [Strava2017], [Kay2012], [Minetti2002] */
const GAP_CURVE_COEFFICIENTS = [1, 2.754, 15.69, 3.723, 7.218] as const;

export const powerPerSecond = (records: SessionRecord[]): number[] => {
  const samples: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.power === undefined) continue;
    const durationSec = Math.round(activeDurationSec({ previous, current }));
    for (let second = 0; second < durationSec; second++) {
      samples.push(current.power);
    }
  }
  return samples;
};

/** @see [CogganAllen2010] */
export const normalizedPowerFromRecords = (records: SessionRecord[]): number | undefined => {
  const samples = powerPerSecond(records);
  if (samples.length < NP_ROLLING_WINDOW_SEC) return undefined;

  let windowSum = 0;
  let fourthPowerSum = 0;
  let windowCount = 0;
  samples.forEach((power, i) => {
    windowSum += power;
    const leaving = samples[i - NP_ROLLING_WINDOW_SEC];
    if (leaving !== undefined) windowSum -= leaving;
    if (i < NP_ROLLING_WINDOW_SEC - 1) return;
    fourthPowerSum += Math.pow(windowSum / NP_ROLLING_WINDOW_SEC, 4);
    windowCount++;
  });

  return Math.round(Math.pow(fourthPowerSum / windowCount, 0.25));
};

/** @see [Strava2017], [Kay2012], [Minetti2002] */
export const gradeAdjustedPaceFactor = (gradient: number): number => {
  const clampedGradient = Math.max(-GAP_GRADIENT_LIMIT, Math.min(GAP_GRADIENT_LIMIT, gradient));
  return GAP_CURVE_COEFFICIENTS.reduce(
    (sum, coefficient, k) => sum + coefficient * Math.pow(clampedGradient, k),
    0,
  );
};

export const gradeAdjustedPaceFromRecords = ({
  records,
  gradients = windowedGradients(records),
}: {
  records: SessionRecord[];
  gradients?: Array<number | undefined>;
}): number | undefined => {
  let totalTimeSec = 0;
  let totalAdjustedDistanceMeters = 0;
  let previous: SessionRecord | undefined = undefined;

  records.forEach((current, i) => {
    if (current.distance === undefined) return;
    const last = previous;
    previous = current;
    const gradient = gradients[i];
    if (last?.distance === undefined || gradient === undefined) return;
    if (!isMovingPair({ previous: last, current })) return;
    const distanceDeltaMeters = current.distance - last.distance;
    if (distanceDeltaMeters <= 0) return;

    totalTimeSec += current.timestamp - last.timestamp;
    totalAdjustedDistanceMeters += distanceDeltaMeters * gradeAdjustedPaceFactor(gradient);
  });

  if (totalAdjustedDistanceMeters === 0) return undefined;

  return (totalTimeSec / totalAdjustedDistanceMeters) * 1000;
};
