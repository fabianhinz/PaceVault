// Sources: [Banister1991], [CogganAllen2010], [Fellrnr]
// See src/packages/engine/SOURCES.md for full citations.

import type { SessionRecord, Gender } from './types.ts';
import { calculateNormalizedPower } from './normalize.ts';

export interface StressSummary {
  durationSec: number;
  avgHr?: number;
  normalizedPower?: number;
}

export interface StressThresholds {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
}

export interface SessionStress {
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  normalizedPower?: number;
}

/**
 * Gender-specific Banister coefficients used in the TRIMP exponential weighting formula.
 * Male coefficients (a=0.64, b=1.92) are from Banister 1991 with strong consensus.
 * Female coefficients (b=1.67) are agreed upon; the `a` coefficient varies across
 * secondary sources (0.64 in Fellrnr/Veohtu, 0.86 in Intervals.icu and others).
 * We use 0.86 following the majority of contemporary implementations.
 */
export const BANISTER = {
  male: { a: 0.64, b: 1.92 },
  female: { a: 0.86, b: 1.67 },
} as const;

/**
 * Calculate TSS (Training Stress Score) from Normalized Power.
 * TSS = (duration_sec * NP * IF) / (FTP * 3600) * 100
 * IF = NP / FTP
 * @see [CogganAllen2010]
 * @param np - Normalized Power in watts.
 * @param durationSec - Total session duration in seconds.
 * @param ftp - Functional Threshold Power in watts.
 * @returns TSS rounded to one decimal, or `undefined` when FTP is invalid.
 */
const calculateTSS = (np: number, durationSec: number, ftp: number): number | undefined => {
  const factor = intensityFactor(np, ftp);
  if (factor === undefined) return undefined;
  const tss = ((durationSec * np * factor) / (ftp * 3600)) * 100;
  return Math.round(tss * 10) / 10;
};

/**
 * Calculate TRIMP (Training Impulse) using Banister formula.
 * TRIMP = duration_min * deltaHR_ratio * 0.64 * e^(1.92 * deltaHR_ratio)  (male)
 * TRIMP = duration_min * deltaHR_ratio * 0.86 * e^(1.67 * deltaHR_ratio)  (female)
 * deltaHR_ratio = (avgHR - restHR) / (maxHR - restHR)
 * @param avgHr - Average heart rate during the session in bpm.
 * @param durationSec - Total session duration in seconds.
 * @param restHr - Resting heart rate in bpm.
 * @param maxHr - Maximum heart rate in bpm.
 * @param gender - Athlete gender used to select Banister coefficients.
 * @returns TRIMP value normalized to the TSS scale (rounded to one decimal), or `0` when HR values are physiologically invalid.
 */
const calculateTRIMP = (
  avgHr: number,
  durationSec: number,
  restHr: number,
  maxHr: number,
  gender: Gender,
): number => {
  if (maxHr <= restHr || avgHr <= restHr || avgHr > maxHr) return 0;

  const durationMin = durationSec / 60;
  const deltaHrRatio = (avgHr - restHr) / (maxHr - restHr);

  let banisterKey: 'female' | 'male' = 'male';
  if (gender === 'female') {
    banisterKey = 'female';
  }
  const { a, b } = BANISTER[banisterKey];

  const trimp = durationMin * deltaHrRatio * a * Math.exp(b * deltaHrRatio);

  // Normalize TRIMP to approximate TSS scale (divide by ~1 hour threshold effort TRIMP).
  // Lactate threshold ≈ 88% of HR reserve (consistent with THRESHOLD_INTENSITY in vdot.ts).
  const thresholdHrRatio = 0.88;
  const normFactor = (60 * thresholdHrRatio * a * Math.exp(b * thresholdHrRatio)) / 100;

  return Math.round((trimp / normFactor) * 10) / 10;
};

/** @see [CogganAllen2010] */
export const intensityFactor = (np: number, ftp: number): number | undefined => {
  if (ftp <= 0) return undefined;
  return np / ftp;
};

/** @see [CogganAllen2010] */
export const variabilityIndex = (np: number, avgPower: number): number | undefined => {
  if (avgPower <= 0) return undefined;
  return np / avgPower;
};

/**
 * Calculate stress from stored summary fields, preferring TSS (power) over TRIMP (HR).
 * TSS needs NP and an FTP above 0; NP 0 W gives TSS 0. TRIMP needs an average HR.
 * Without either, a duration-based estimate is used.
 * @see [CogganAllen2010] [Banister1991]
 * @param summary - Duration, average HR and Normalized Power of the session.
 * @param thresholds - Rest HR, max HR, gender and optional FTP valid at the session date.
 * @returns The stress score (`tss`) and the method used (`stressMethod`).
 */
export const calculateSummaryStress = (
  summary: StressSummary,
  thresholds: StressThresholds,
): SessionStress => {
  const ftp = thresholds.ftp;
  if (summary.normalizedPower !== undefined && ftp !== undefined && ftp > 0) {
    const tss = calculateTSS(summary.normalizedPower, summary.durationSec, ftp);
    if (tss !== undefined) return { tss, stressMethod: 'tss' };
  }

  if (summary.avgHr !== undefined) {
    return {
      tss: calculateTRIMP(
        summary.avgHr,
        summary.durationSec,
        thresholds.restHr,
        thresholds.maxHr,
        thresholds.gender,
      ),
      stressMethod: 'trimp',
    };
  }

  return {
    tss: Math.round((summary.durationSec / 3600) * 30),
    stressMethod: 'duration',
  };
};

/**
 * Calculate stress for a session from its records, preferring TSS (power) over TRIMP (HR).
 * @param records - Array of session records containing power and/or HR samples.
 * @param durationSec - Total session duration in seconds.
 * @param avgHr - Average heart rate in bpm, used as fallback when power data is absent.
 * @param restHr - Resting heart rate in bpm, required for TRIMP calculation.
 * @param maxHr - Maximum heart rate in bpm, required for TRIMP calculation.
 * @param gender - Athlete gender used to select Banister coefficients for TRIMP.
 * @param ftp - Optional Functional Threshold Power in watts; when provided and valid, TSS is attempted first.
 * @returns Object with the stress score (`tss`), the method used (`stressMethod`), and `normalizedPower` whenever it can be derived from the records.
 */
export const calculateSessionStress = (
  records: SessionRecord[],
  durationSec: number,
  avgHr: number | undefined,
  restHr: number,
  maxHr: number,
  gender: Gender,
  ftp?: number,
): SessionStress => {
  const normalizedPower = calculateNormalizedPower(records);
  const stress = calculateSummaryStress(
    { durationSec, avgHr, normalizedPower },
    { restHr, maxHr, gender, ftp },
  );
  if (normalizedPower === undefined) return stress;
  return { ...stress, normalizedPower };
};
