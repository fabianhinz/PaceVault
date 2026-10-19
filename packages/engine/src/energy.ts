import type { Gender, SessionRecord, Sport } from './types.ts';
import { windowedGradients } from './gradient.ts';
import { activeSeconds, gradeAdjustedPaceFactor } from './normalize.ts';

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

/** @see [EttemaLoras2009], [MoseleyJeukendrup2001] */
export const CYCLING_GROSS_EFFICIENCY = 0.21;
/** @see [Margaria1963], [Fletcher2009] */
export const RUNNING_NET_COST_J_PER_KG_M = 4.184;
/** @see [ACSM2018] */
export const RESTING_J_PER_KG_S = 4184 / 3600;
export const JOULES_PER_KCAL = 4184;
export const MIN_ENERGY_COVERAGE = 0.9;
/** @see [EttemaLoras2009], [Fletcher2009], [Keytel2005] */
export const ENERGY_UNCERTAINTY: Record<EnergyMethod, number> = {
  power: 0.15,
  running: 0.15,
  heartRate: 0.25,
};
/** @see [Keytel2005] */
export const KEYTEL_COEFFICIENTS: Record<Gender, KeytelCoefficients> = {
  male: { intercept: -55.0969, hr: 0.6309, weight: 0.1988, age: 0.2017 },
  female: { intercept: -20.4022, hr: 0.4472, weight: -0.1263, age: 0.074 },
};
export const ENERGY_METHODS_BY_SPORT: Record<Sport, EnergyMethod[]> = {
  cycling: ['power', 'heartRate'],
  running: ['running', 'heartRate'],
};

type MethodPick = { method: EnergyMethod } | EnergyBlocked | undefined;

const coveredByRecords = (
  method: EnergyMethod,
  previous: SessionRecord,
  current: SessionRecord,
  gradient: number | undefined,
): boolean => {
  if (method === 'power') return current.power !== undefined;
  if (method === 'heartRate') return current.hr !== undefined;
  if (previous.distance === undefined || current.distance === undefined) return false;
  return current.distance - previous.distance >= 0 && gradient !== undefined;
};

const missingBody = (method: EnergyMethod, body: EnergyBody): EnergyBlocker | undefined => {
  if (method === 'power') return undefined;
  const needsAge = method === 'heartRate' && body.age === undefined;
  if (body.weightKg === undefined && needsAge) return 'weightAndAge';
  if (body.weightKg === undefined) return 'weight';
  if (needsAge) return 'age';
  return undefined;
};

const keytelKjPerMin = (hr: number, weightKg: number, age: number, gender: Gender): number => {
  const c = KEYTEL_COEFFICIENTS[gender];
  return c.intercept + c.hr * hr + c.weight * weightKg + c.age * age;
};

const intervalJoules = (
  method: EnergyMethod,
  previous: SessionRecord,
  current: SessionRecord,
  gradient: number | undefined,
  body: EnergyBody,
): number | null => {
  const dt = activeSeconds(previous, current);
  if (dt === 0) return null;
  if (method === 'power') {
    if (current.power === undefined) return null;
    return (current.power * dt) / CYCLING_GROSS_EFFICIENCY;
  }
  const weightKg = body.weightKg;
  if (weightKg === undefined) return null;
  if (method === 'running') {
    if (previous.distance === undefined || current.distance === undefined) return null;
    if (gradient === undefined) return null;
    const dx = current.distance - previous.distance;
    if (dx < 0) return null;
    const factor = gradeAdjustedPaceFactor(gradient);
    return weightKg * (RUNNING_NET_COST_J_PER_KG_M * dx * factor + RESTING_J_PER_KG_S * dt);
  }
  if (body.age === undefined || body.gender === undefined || current.hr === undefined) return null;
  const keytel = (keytelKjPerMin(current.hr, weightKg, body.age, body.gender) * 1000 * dt) / 60;
  return Math.max(keytel, weightKg * RESTING_J_PER_KG_S * dt);
};

const recordCoverage = (
  method: EnergyMethod,
  records: SessionRecord[],
  gradients: Array<number | undefined>,
): number => {
  let active = 0;
  let covered = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current) continue;
    const dt = activeSeconds(previous, current);
    if (dt === 0) continue;
    active += dt;
    if (coveredByRecords(method, previous, current, gradients[i])) covered += dt;
  }
  if (active === 0) return 0;
  return covered / active;
};

const pickMethod = (
  records: SessionRecord[],
  sport: Sport,
  body: EnergyBody,
  gradients: Array<number | undefined>,
): MethodPick => {
  let blockedBy: EnergyBlocker | undefined = undefined;
  for (const method of ENERGY_METHODS_BY_SPORT[sport]) {
    if (recordCoverage(method, records, gradients) < MIN_ENERGY_COVERAGE) continue;
    const missing = missingBody(method, body);
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

const methodSeries = (
  method: EnergyMethod,
  records: SessionRecord[],
  body: EnergyBody,
  gradients: Array<number | undefined>,
): Array<number | null> =>
  records.map((current, i) => {
    const previous = records[i - 1];
    if (!previous) return null;
    return intervalJoules(method, previous, current, gradients[i], body);
  });

const sumJoules = (joules: Array<number | null>): number =>
  joules.reduce<number>((sum, value) => {
    if (value === null) return sum;
    return sum + value;
  }, 0);

export const estimateSessionEnergy = (
  records: SessionRecord[],
  sport: Sport,
  body: EnergyBody,
  gradients: Array<number | undefined> = windowedGradients(records),
): EnergyEstimate | EnergyBlocked | undefined => {
  const pick = pickMethod(records, sport, body, gradients);
  if (pick === undefined || 'blockedBy' in pick) return pick;
  const kcal = sumJoules(methodSeries(pick.method, records, body, gradients)) / JOULES_PER_KCAL;
  return { method: pick.method, kcal, uncertainty: ENERGY_UNCERTAINTY[pick.method] };
};
