import type { SessionRecord } from './types.ts';
import { windowedGradients } from './gradient.ts';

export const MAX_MOVING_PAIR_GAP_S = 10;

/** @see [CogganAllen2010] */
const NP_ROLLING_WINDOW_SEC = 30;
/** @see [Strava2017] */
const GAP_GRADIENT_LIMIT = 0.3;
/** @see [Strava2017], [Kay2012], [Minetti2002] */
const GAP_CURVE_COEFFICIENTS = [1, 2.754, 15.69, 3.723, 7.218] as const;

export const activeSeconds = (previous: SessionRecord, current: SessionRecord): number => {
  const dt = current.timestamp - previous.timestamp;
  if (dt <= 0 || dt > MAX_MOVING_PAIR_GAP_S) return 0;
  return dt;
};

export const powerPerSecond = (records: SessionRecord[]): number[] => {
  const samples: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.power === undefined) continue;
    const seconds = Math.round(activeSeconds(previous, current));
    for (let s = 0; s < seconds; s++) {
      samples.push(current.power);
    }
  }
  return samples;
};

/** @see [CogganAllen2010] */
export const calculateNormalizedPower = (records: SessionRecord[]): number | undefined => {
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
  const g = Math.max(-GAP_GRADIENT_LIMIT, Math.min(GAP_GRADIENT_LIMIT, gradient));
  return GAP_CURVE_COEFFICIENTS.reduce((sum, c, k) => sum + c * Math.pow(g, k), 0);
};

export const isMovingPair = (previous: SessionRecord, current: SessionRecord): boolean => {
  if (activeSeconds(previous, current) === 0) return false;
  if (previous.speed === undefined || previous.speed <= 0) return false;
  return current.speed !== undefined && current.speed > 0;
};

export const calculateGAP = (
  records: SessionRecord[],
  gradients: Array<number | undefined> = windowedGradients(records),
): number | undefined => {
  let totalTime = 0;
  let totalAdjustedDistance = 0;
  let previous: SessionRecord | undefined = undefined;

  records.forEach((current, i) => {
    if (current.distance === undefined) return;
    const last = previous;
    previous = current;
    const gradient = gradients[i];
    if (last?.distance === undefined || gradient === undefined) return;
    if (!isMovingPair(last, current)) return;
    const dx = current.distance - last.distance;
    if (dx <= 0) return;

    totalTime += current.timestamp - last.timestamp;
    totalAdjustedDistance += dx * gradeAdjustedPaceFactor(gradient);
  });

  if (totalAdjustedDistance === 0) return undefined;

  return (totalTime / totalAdjustedDistance) * 1000;
};
