// Sources: [DanielsGilbert1979], [Daniels2013]
// See packages/engine/SOURCES.md for full citations.

import type { RaceDistance } from './types.ts';

interface RacePrediction {
  timeSec: number;
  paceSecPerKm: number;
}

export const METERS_BY_RACE_DISTANCE: Record<RaceDistance, number> = {
  '5k': 5000,
  '10k': 10000,
  'half-marathon': 21097.5,
  marathon: 42195,
};

const DANIELS_VO2_OFFSET = 4.6;
const DANIELS_VO2_LINEAR = 0.182258;
const DANIELS_VO2_QUADRATIC = 0.000104;
const THRESHOLD_INTENSITY = 0.88;
const FASTEST_RACE_TIME_MIN = 8;
const SLOWEST_RACE_TIME_MIN = 600;
const BISECTION_MAX_ITERATIONS = 50;
const BISECTION_TOLERANCE_MIN = 1e-6;

const vo2FromVelocity = (velocityMetersPerMin: number): number =>
  -DANIELS_VO2_OFFSET +
  DANIELS_VO2_LINEAR * velocityMetersPerMin +
  DANIELS_VO2_QUADRATIC * velocityMetersPerMin * velocityMetersPerMin;

const pctVo2max = (durationMin: number): number =>
  0.8 +
  0.1894393 * Math.exp(-0.012778 * durationMin) +
  0.2989558 * Math.exp(-0.1932605 * durationMin);

const velocityFromVo2 = (vo2: number): number => {
  const quadratic = DANIELS_VO2_QUADRATIC;
  const linear = DANIELS_VO2_LINEAR;
  const constant = -(DANIELS_VO2_OFFSET + vo2);
  return (-linear + Math.sqrt(linear * linear - 4 * quadratic * constant)) / (2 * quadratic);
};

/** @see [DanielsGilbert1979] @see [Daniels2013] */
export const vdotFromRace = ({
  distanceMeters,
  timeMin,
}: {
  distanceMeters: number;
  timeMin: number;
}): number => {
  const velocityMetersPerMin = distanceMeters / timeMin;
  return vo2FromVelocity(velocityMetersPerMin) / pctVo2max(timeMin);
};

export const thresholdPaceFromRace = ({
  distanceMeters,
  timeMin,
}: {
  distanceMeters: number;
  timeMin: number;
}): number => {
  const vdot = vdotFromRace({ distanceMeters, timeMin });
  const targetVo2 = THRESHOLD_INTENSITY * vdot;
  const velocityMetersPerMin = velocityFromVo2(targetVo2);
  const paceSecPerKm = Math.round((1000 / velocityMetersPerMin) * 60);
  return paceSecPerKm;
};

/** @see [DanielsGilbert1979] @see [Daniels2013] */
export const predictRaceTime = ({
  vdot,
  targetDistanceMeters,
}: {
  vdot: number;
  targetDistanceMeters: number;
}): number | undefined => {
  if (vdot <= 0 || targetDistanceMeters <= 0) return undefined;

  let lowerMin = FASTEST_RACE_TIME_MIN;
  let upperMin = SLOWEST_RACE_TIME_MIN;

  const vdotError = (durationMin: number): number => {
    const velocityMetersPerMin = targetDistanceMeters / durationMin;
    return vo2FromVelocity(velocityMetersPerMin) / pctVo2max(durationMin) - vdot;
  };

  // vdotError(lowerMin) should be positive (too fast → higher VDOT), vdotError(upperMin) negative (too slow)
  if (vdotError(lowerMin) < 0 || vdotError(upperMin) > 0) return undefined;

  for (let i = 0; i < BISECTION_MAX_ITERATIONS; i++) {
    const middleMin = (lowerMin + upperMin) / 2;
    if (upperMin - lowerMin < BISECTION_TOLERANCE_MIN) break;
    if (vdotError(middleMin) > 0) {
      lowerMin = middleMin;
    } else {
      upperMin = middleMin;
    }
  }

  const durationMin = (lowerMin + upperMin) / 2;
  return durationMin * 60;
};

const predictionFor = ({
  vdot,
  distance,
}: {
  vdot: number;
  distance: RaceDistance;
}): RacePrediction | undefined => {
  const meters = METERS_BY_RACE_DISTANCE[distance];
  const predictedSec = predictRaceTime({ vdot, targetDistanceMeters: meters });
  if (predictedSec === undefined) return undefined;
  return { timeSec: predictedSec, paceSecPerKm: predictedSec / (meters / 1000) };
};

/** @see [DanielsGilbert1979] @see [Daniels2013] */
export const predictRaceTimes = ({
  distanceMeters,
  timeSec,
}: {
  distanceMeters: number;
  timeSec: number;
}): Record<RaceDistance, RacePrediction> | undefined => {
  const timeMin = timeSec / 60;
  const vdot = vdotFromRace({ distanceMeters, timeMin });
  if (!isFinite(vdot) || vdot <= 0) return undefined;
  const fiveK = predictionFor({ vdot, distance: '5k' });
  const tenK = predictionFor({ vdot, distance: '10k' });
  const halfMarathon = predictionFor({ vdot, distance: 'half-marathon' });
  const marathon = predictionFor({ vdot, distance: 'marathon' });
  if (!fiveK || !tenK || !halfMarathon || !marathon) return undefined;
  return { '5k': fiveK, '10k': tenK, 'half-marathon': halfMarathon, marathon };
};
