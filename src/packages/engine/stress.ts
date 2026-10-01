// Sources: [Banister1991], [CogganAllen2010], [Fellrnr]
// See src/engine/SOURCES.md for full citations.

import type { SessionRecord, Gender } from './types.ts';
import { calculateNormalizedPower } from './normalize.ts';

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
 * Calculate TSS (Training Stress Score) when power data is available.
 * TSS = (duration_sec * NP * IF) / (FTP * 3600) * 100
 * IF = NP / FTP
 * @param records - Array of session records containing power samples.
 * @param durationSec - Total session duration in seconds.
 * @param ftp - Functional Threshold Power in watts.
 * @returns Object with rounded `tss` and `normalizedPower`, or `undefined` when NP cannot be derived or FTP is invalid.
 */
const calculateTSS = (
  records: SessionRecord[],
  durationSec: number,
  ftp: number,
): { tss: number; normalizedPower: number } | undefined => {
  const np = calculateNormalizedPower(records);
  if (np === undefined || ftp <= 0) return undefined;

  const intensityFactor = np / ftp;
  const tss = ((durationSec * np * intensityFactor) / (ftp * 3600)) * 100;

  return {
    tss: Math.round(tss * 10) / 10,
    normalizedPower: np,
  };
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

/**
 * Calculate stress for a session, preferring TSS (power) over TRIMP (HR).
 * @param records - Array of session records containing power and/or HR samples.
 * @param durationSec - Total session duration in seconds.
 * @param avgHr - Average heart rate in bpm, used as fallback when power data is absent.
 * @param restHr - Resting heart rate in bpm, required for TRIMP calculation.
 * @param maxHr - Maximum heart rate in bpm, required for TRIMP calculation.
 * @param gender - Athlete gender used to select Banister coefficients for TRIMP.
 * @param ftp - Optional Functional Threshold Power in watts; when provided and valid, TSS is attempted first.
 * @returns Object with the stress score (`tss`), the method used (`stressMethod`), and optionally `normalizedPower` when TSS was computed from power data.
 */
export const calculateSessionStress = (
  records: SessionRecord[],
  durationSec: number,
  avgHr: number | undefined,
  restHr: number,
  maxHr: number,
  gender: Gender,
  ftp?: number,
): { tss: number; stressMethod: 'tss' | 'trimp' | 'duration'; normalizedPower?: number } => {
  // Try TSS first (requires power data + FTP)
  if (ftp && ftp > 0) {
    const tssResult = calculateTSS(records, durationSec, ftp);
    if (tssResult) {
      return {
        tss: tssResult.tss,
        stressMethod: 'tss',
        normalizedPower: tssResult.normalizedPower,
      };
    }
  }

  // Fall back to TRIMP (requires HR data)
  if (avgHr !== undefined) {
    const trimp = calculateTRIMP(avgHr, durationSec, restHr, maxHr, gender);
    return {
      tss: trimp,
      stressMethod: 'trimp',
    };
  }

  // No usable data — assign minimal stress estimate based on duration
  return {
    tss: Math.round((durationSec / 3600) * 30),
    stressMethod: 'duration',
  };
};
