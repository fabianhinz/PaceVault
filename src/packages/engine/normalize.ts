import type { SessionRecord } from './types.ts';
import { windowedGradients } from './gradient.ts';

const NP_ROLLING_WINDOW_SEC = 30;
const GAP_GRADIENT_LIMIT = 0.3;
const GAP_CURVE_COEFFICIENTS = [1, 2.754, 15.69, 3.723, 7.218] as const;
const MAX_MOVING_PAIR_GAP_S = 10;

export const calculateNormalizedPower = (records: SessionRecord[]): number | undefined => {
  const powerData = records.map((r) => r.power).filter((v): v is number => v !== undefined);

  if (powerData.length < NP_ROLLING_WINDOW_SEC) return undefined;

  const rollingAvg: number[] = [];
  for (let i = NP_ROLLING_WINDOW_SEC - 1; i < powerData.length; i++) {
    let sum = 0;
    for (let j = i - (NP_ROLLING_WINDOW_SEC - 1); j <= i; j++) {
      sum += powerData[j] ?? 0;
    }
    rollingAvg.push(sum / NP_ROLLING_WINDOW_SEC);
  }

  if (rollingAvg.length === 0) return undefined;

  const fourthPowerAvg =
    rollingAvg.reduce((sum, val) => sum + Math.pow(val, 4), 0) / rollingAvg.length;

  return Math.round(Math.pow(fourthPowerAvg, 0.25));
};

export const gradeAdjustedPaceFactor = (gradient: number): number => {
  const g = Math.max(-GAP_GRADIENT_LIMIT, Math.min(GAP_GRADIENT_LIMIT, gradient));
  return GAP_CURVE_COEFFICIENTS.reduce((sum, c, k) => sum + c * Math.pow(g, k), 0);
};

export const isMovingPair = (previous: SessionRecord, current: SessionRecord): boolean => {
  const dt = current.timestamp - previous.timestamp;
  if (dt <= 0 || dt > MAX_MOVING_PAIR_GAP_S) return false;
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
