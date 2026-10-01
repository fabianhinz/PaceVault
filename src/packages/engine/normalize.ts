// Sources: [CogganAllen2010], [Minetti2002]
// See src/engine/SOURCES.md for full citations.

import type { SessionRecord } from './types.ts';

/** Width of the rolling average window used in the normalized power calculation, in seconds. */
const NP_ROLLING_WINDOW_SEC = 30;

/**
 * Calculate Normalized Power (NP) from time-series power data using the standard 30 s rolling-average → 4th-power → mean → 4th-root algorithm.
 * @param records - Full time-series session records; records without `power` are skipped, assumed to be sampled at ~1 Hz.
 * @returns NP rounded to the nearest watt, or `undefined` when fewer than `NP_ROLLING_WINDOW_SEC` valid power samples are available.
 */
export const calculateNormalizedPower = (records: SessionRecord[]): number | undefined => {
  const powerData = records.map((r) => r.power).filter((v): v is number => v !== undefined);

  if (powerData.length < NP_ROLLING_WINDOW_SEC) return undefined;

  // 30-second rolling average (assuming 1 record per second)
  const rollingAvg: number[] = [];
  for (let i = NP_ROLLING_WINDOW_SEC - 1; i < powerData.length; i++) {
    let sum = 0;
    for (let j = i - (NP_ROLLING_WINDOW_SEC - 1); j <= i; j++) {
      sum += powerData[j] ?? 0;
    }
    rollingAvg.push(sum / NP_ROLLING_WINDOW_SEC);
  }

  if (rollingAvg.length === 0) return undefined;

  // Raise to 4th power, average, then 4th root
  const fourthPowerAvg =
    rollingAvg.reduce((sum, val) => sum + Math.pow(val, 4), 0) / rollingAvg.length;

  return Math.round(Math.pow(fourthPowerAvg, 0.25));
};

/**
 * Compute the metabolic cost multiplier for a given gradient using the Minetti cost-of-transport polynomial, relative to flat running.
 * @param gradient - Slope as a decimal fraction (e.g. `0.05` = 5%); clamped to [-0.45, 0.45].
 * @returns Dimensionless factor where `1.0` represents flat-ground effort; values above 1 indicate uphill, below 1 indicate downhill.
 */
export const gradeAdjustedPaceFactor = (gradient: number): number => {
  // Simplified Minetti curve: metabolic cost relative to flat running
  // C(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6
  // where i = gradient as decimal
  const i = Math.max(-0.45, Math.min(0.45, gradient));
  const cost =
    155.4 * Math.pow(i, 5) -
    30.4 * Math.pow(i, 4) -
    43.3 * Math.pow(i, 3) +
    46.3 * Math.pow(i, 2) +
    19.5 * i +
    3.6;

  const flatCost = 3.6; // cost at 0% grade
  return cost / flatCost;
};

/**
 * Calculate Grade Adjusted Pace (GAP) from time-series records by scaling each segment's distance by its Minetti cost factor to compute equivalent flat-ground distance.
 * @param records - Full time-series session records; records must have `speed > 0`, `distance`, and either `grade` or `elevation`; fewer than 2 valid records returns `undefined`.
 * @returns GAP in seconds per kilometre adjusted for elevation gain/loss, or `undefined` when there is insufficient data.
 */
export const calculateGAP = (records: SessionRecord[]): number | undefined => {
  const validRecords = records.filter(
    (r) =>
      r.speed !== undefined &&
      r.speed > 0 &&
      r.distance !== undefined &&
      (r.grade !== undefined || r.elevation !== undefined),
  );

  if (validRecords.length < 2) return undefined;

  let totalTime = 0;
  let totalAdjustedDistance = 0;

  for (let i = 1; i < validRecords.length; i++) {
    const prev = validRecords[i - 1];
    const curr = validRecords[i];
    if (!prev || !curr) continue;
    if (curr.distance === undefined || prev.distance === undefined) continue;
    const dx = curr.distance - prev.distance;

    if (dx <= 0) continue;

    let gradient: number;
    if (curr.grade !== undefined) {
      gradient = curr.grade / 100;
    } else if (curr.elevation !== undefined && prev.elevation !== undefined) {
      gradient = (curr.elevation - prev.elevation) / dx;
    } else {
      continue;
    }

    const factor = gradeAdjustedPaceFactor(gradient);
    const dt = curr.timestamp - prev.timestamp;

    totalTime += dt;
    totalAdjustedDistance += dx * factor;
  }

  if (totalAdjustedDistance === 0) return undefined;

  // Return sec/km
  return (totalTime / totalAdjustedDistance) * 1000;
};
