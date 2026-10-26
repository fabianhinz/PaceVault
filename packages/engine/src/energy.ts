import type { Gender, SessionRecord, Sport } from './types.ts';
import { activeSeconds } from './recordPairs.ts';
import { gradeAdjustedPaceFactor } from './normalizedEffort.ts';

type EnergyMethod = 'power' | 'running' | 'heartRate';

export type EnergyBlocker = 'weight' | 'age' | 'weightAndAge';

export interface EnergyBody {
  weightKg?: number;
  age?: number;
  gender?: Gender;
}

export interface EnergyEstimate {
  method: EnergyMethod;
  kcal: number;
  uncertainty: number;
}

export interface EnergyBlocked {
  blockedBy: EnergyBlocker;
}

interface KeytelCoefficients {
  intercept: number;
  hr: number;
  weight: number;
  age: number;
}

type MethodPick = { method: EnergyMethod } | EnergyBlocked | undefined;

/** @see [EttemaLoras2009], [MoseleyJeukendrup2001] */
const CYCLING_GROSS_EFFICIENCY = 0.21;
/** @see [Margaria1963], [Fletcher2009] */
const RUNNING_NET_COST_JOULES_PER_KG_METER = 4.184;
/** @see [ACSM2018] */
const RESTING_JOULES_PER_KG_SEC = 4184 / 3600;
const JOULES_PER_KCAL = 4184;
const MIN_ENERGY_COVERAGE = 0.9;
/** @see [EttemaLoras2009], [Fletcher2009], [Keytel2005] */
const UNCERTAINTY_BY_ENERGY_METHOD: Record<EnergyMethod, number> = {
  power: 0.15,
  running: 0.15,
  heartRate: 0.25,
};
/** @see [Keytel2005] */
const KEYTEL_COEFFICIENTS_BY_GENDER: Record<Gender, KeytelCoefficients> = {
  male: { intercept: -55.0969, hr: 0.6309, weight: 0.1988, age: 0.2017 },
  female: { intercept: -20.4022, hr: 0.4472, weight: -0.1263, age: 0.074 },
};
const ENERGY_METHODS_BY_SPORT: Record<Sport, EnergyMethod[]> = {
  cycling: ['power', 'heartRate'],
  running: ['running', 'heartRate'],
};

const isCoveredByRecords = ({
  method,
  previous,
  current,
  gradient,
}: {
  method: EnergyMethod;
  previous: SessionRecord;
  current: SessionRecord;
  gradient: number | undefined;
}): boolean => {
  switch (method) {
    case 'power':
      return current.power !== undefined;
    case 'heartRate':
      return current.hr !== undefined;
    case 'running':
      if (previous.distance === undefined || current.distance === undefined) return false;
      return current.distance - previous.distance >= 0 && gradient !== undefined;
  }
};

const missingBody = ({
  method,
  body,
}: {
  method: EnergyMethod;
  body: EnergyBody;
}): EnergyBlocker | undefined => {
  switch (method) {
    case 'power':
      return undefined;
    case 'running':
      if (body.weightKg === undefined) return 'weight';
      return undefined;
    case 'heartRate':
      if (body.weightKg === undefined && body.age === undefined) return 'weightAndAge';
      if (body.weightKg === undefined) return 'weight';
      if (body.age === undefined) return 'age';
      return undefined;
  }
};

const keytelKjPerMin = ({
  hr,
  weightKg,
  age,
  gender,
}: {
  hr: number;
  weightKg: number;
  age: number;
  gender: Gender;
}): number => {
  const coefficients = KEYTEL_COEFFICIENTS_BY_GENDER[gender];
  return (
    coefficients.intercept +
    coefficients.hr * hr +
    coefficients.weight * weightKg +
    coefficients.age * age
  );
};

const runningJoules = ({
  previous,
  current,
  gradient,
  body,
  elapsedSec,
}: {
  previous: SessionRecord;
  current: SessionRecord;
  gradient: number | undefined;
  body: EnergyBody;
  elapsedSec: number;
}): number | null => {
  const weightKg = body.weightKg;
  if (weightKg === undefined) return null;
  if (previous.distance === undefined || current.distance === undefined) return null;
  if (gradient === undefined) return null;
  const distanceDeltaMeters = current.distance - previous.distance;
  if (distanceDeltaMeters < 0) return null;
  const factor = gradeAdjustedPaceFactor(gradient);
  return (
    weightKg *
    (RUNNING_NET_COST_JOULES_PER_KG_METER * distanceDeltaMeters * factor +
      RESTING_JOULES_PER_KG_SEC * elapsedSec)
  );
};

const heartRateJoules = ({
  current,
  body,
  elapsedSec,
}: {
  current: SessionRecord;
  body: EnergyBody;
  elapsedSec: number;
}): number | null => {
  const weightKg = body.weightKg;
  if (weightKg === undefined) return null;
  if (body.age === undefined || body.gender === undefined || current.hr === undefined) return null;
  const keytel =
    (keytelKjPerMin({ hr: current.hr, weightKg, age: body.age, gender: body.gender }) *
      1000 *
      elapsedSec) /
    60;
  return Math.max(keytel, weightKg * RESTING_JOULES_PER_KG_SEC * elapsedSec);
};

const intervalJoules = ({
  method,
  previous,
  current,
  gradient,
  body,
}: {
  method: EnergyMethod;
  previous: SessionRecord;
  current: SessionRecord;
  gradient: number | undefined;
  body: EnergyBody;
}): number | null => {
  const elapsedSec = activeSeconds({ previous, current });
  if (elapsedSec === 0) return null;
  switch (method) {
    case 'power':
      if (current.power === undefined) return null;
      return (current.power * elapsedSec) / CYCLING_GROSS_EFFICIENCY;
    case 'running':
      return runningJoules({ previous, current, gradient, body, elapsedSec });
    case 'heartRate':
      return heartRateJoules({ current, body, elapsedSec });
  }
};

const recordCoverage = ({
  method,
  records,
  gradients,
}: {
  method: EnergyMethod;
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}): number => {
  let activeSec = 0;
  let coveredSec = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current) continue;
    const elapsedSec = activeSeconds({ previous, current });
    if (elapsedSec === 0) continue;
    activeSec += elapsedSec;
    if (isCoveredByRecords({ method, previous, current, gradient: gradients[i] }))
      coveredSec += elapsedSec;
  }
  if (activeSec === 0) return 0;
  return coveredSec / activeSec;
};

const pickMethod = ({
  records,
  sport,
  body,
  gradients,
}: {
  records: SessionRecord[];
  sport: Sport;
  body: EnergyBody;
  gradients: Array<number | undefined>;
}): MethodPick => {
  let blockedBy: EnergyBlocker | undefined = undefined;
  for (const method of ENERGY_METHODS_BY_SPORT[sport]) {
    if (recordCoverage({ method, records, gradients }) < MIN_ENERGY_COVERAGE) continue;
    const missing = missingBody({ method, body });
    if (missing !== undefined) {
      if (blockedBy === undefined) blockedBy = missing;
      continue;
    }
    // Keytel has no equation without a gender: missing is missing, not an average.
    if (method === 'heartRate' && body.gender === undefined) continue;
    return { method };
  }
  if (blockedBy === undefined) return undefined;
  return { blockedBy };
};

const methodSeries = ({
  method,
  records,
  body,
  gradients,
}: {
  method: EnergyMethod;
  records: SessionRecord[];
  body: EnergyBody;
  gradients: Array<number | undefined>;
}): Array<number | null> =>
  records.map((current, i) => {
    const previous = records[i - 1];
    if (!previous) return null;
    return intervalJoules({ method, previous, current, gradient: gradients[i], body });
  });

const sumJoules = (joules: Array<number | null>): number =>
  joules.reduce<number>((sum, value) => {
    if (value === null) return sum;
    return sum + value;
  }, 0);

export const estimateSessionEnergy = ({
  records,
  sport,
  body,
  gradients,
}: {
  records: SessionRecord[];
  sport: Sport;
  body: EnergyBody;
  gradients: Array<number | undefined>;
}): EnergyEstimate | EnergyBlocked | undefined => {
  const pick = pickMethod({ records, sport, body, gradients });
  if (pick === undefined || 'blockedBy' in pick) return pick;
  const kcal =
    sumJoules(methodSeries({ method: pick.method, records, body, gradients })) / JOULES_PER_KCAL;
  return { method: pick.method, kcal, uncertainty: UNCERTAINTY_BY_ENERGY_METHOD[pick.method] };
};
