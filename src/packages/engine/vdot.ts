// Sources: [DanielsGilbert1979], [Daniels2013]
// See src/packages/engine/SOURCES.md for full citations.

import type { RaceDistance } from './types.ts';

/**
 * Canonical race distances in metres, keyed by the {@link RaceDistance} union type.
 */
export const RACE_DISTANCE_METERS: Record<RaceDistance, number> = {
  '5k': 5000,
  '10k': 10000,
  'half-marathon': 21097.5,
  marathon: 42195,
};

// Daniels/Gilbert VO2 from velocity (m/min)
const vo2FromVelocity = (v: number): number => -4.6 + 0.182258 * v + 0.000104 * v * v;

// Daniels/Gilbert percent VO2max sustained over duration (minutes)
const pctVo2max = (t: number): number =>
  0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);

/**
 * Estimates VDOT using the Daniels/Gilbert formula from a race result.
 * @param distanceMeters - Race distance in metres.
 * @param timeMinutes - Finishing time in minutes.
 * @returns VDOT value (mL/kg/min) representing the runner's current aerobic fitness.
 * @see [DanielsGilbert1979]
 * @see [Daniels2013]
 */
export const calculateVdot = (distanceMeters: number, timeMinutes: number): number => {
  const velocity = distanceMeters / timeMinutes;
  return vo2FromVelocity(velocity) / pctVo2max(timeMinutes);
};

// Solve velocity from VO2: 0.000104·v² + 0.182258·v − (4.6 + vo2) = 0
const velocityFromVo2 = (vo2: number): number => {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + vo2);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
};

const THRESHOLD_INTENSITY = 0.88;

/**
 * Derives lactate-threshold pace in seconds per kilometre from a race result.
 * @param distanceMeters - Race distance in metres.
 * @param timeMinutes - Finishing time in minutes.
 * @returns Threshold pace in seconds per kilometre, rounded to the nearest integer.
 */
export const thresholdPaceFromRace = (distanceMeters: number, timeMinutes: number): number => {
  const vdot = calculateVdot(distanceMeters, timeMinutes);
  const targetVo2 = THRESHOLD_INTENSITY * vdot;
  const velocity = velocityFromVo2(targetVo2); // m/min
  return Math.round((1000 / velocity) * 60); // sec/km
};

/**
 * Predicts race time for a given VDOT and distance using bisection.
 * Finds `t` (minutes) where `vo2FromVelocity(d/t) / pctVo2max(t) ≈ vdot`.
 * @param vdot - Runner's VDOT value.
 * @param targetDistanceMeters - Target race distance in metres.
 * @returns Predicted time in seconds, or `undefined` if no solution found.
 * @see [DanielsGilbert1979]
 * @see [Daniels2013]
 */
export const predictRaceTime = (vdot: number, targetDistanceMeters: number): number | undefined => {
  if (vdot <= 0 || targetDistanceMeters <= 0) return undefined;

  let lo = 8; // minutes
  let hi = 600; // minutes

  const f = (t: number): number => {
    const velocity = targetDistanceMeters / t;
    return vo2FromVelocity(velocity) / pctVo2max(t) - vdot;
  };

  // f(lo) should be positive (too fast → higher VDOT), f(hi) negative (too slow)
  if (f(lo) < 0 || f(hi) > 0) return undefined;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (hi - lo < 1e-6) break;
    if (f(mid) > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return ((lo + hi) / 2) * 60; // convert minutes to seconds
};

/**
 * Predicts race times for all standard distances from a single race result.
 * @param distanceMeters - Known race distance in metres.
 * @param timeSeconds - Known finishing time in seconds.
 * @returns Predicted times and paces for each standard race distance, or `undefined` if VDOT cannot be computed.
 * @see [DanielsGilbert1979]
 * @see [Daniels2013]
 */
export const predictRaceTimes = (
  distanceMeters: number,
  timeSeconds: number,
): Record<RaceDistance, { timeSeconds: number; paceSecPerKm: number }> | undefined => {
  const timeMinutes = timeSeconds / 60;
  const vdot = calculateVdot(distanceMeters, timeMinutes);
  if (!isFinite(vdot) || vdot <= 0) return undefined;

  const result = {} as Record<RaceDistance, { timeSeconds: number; paceSecPerKm: number }>;

  for (const key of Object.keys(RACE_DISTANCE_METERS) as RaceDistance[]) {
    const dist = RACE_DISTANCE_METERS[key];
    const predicted = predictRaceTime(vdot, dist);
    if (predicted === undefined) return undefined;
    result[key] = { timeSeconds: predicted, paceSecPerKm: predicted / (dist / 1000) };
  }

  return result;
};
