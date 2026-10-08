// Sources: [Banister1991], [Karvonen1957], [Swain1998], [Billat1999], [Wenger1986]
// See src/engine/SOURCES.md for full citations.

// ---------------------------------------------------------------------------
// Training Effect — Reference-Anchored TRIMP Approximation
// ---------------------------------------------------------------------------
// Garmin/Firstbeat's actual Training Effect algorithm uses real-time EPOC
// (Excess Post-exercise Oxygen Consumption) estimation derived from heartbeat
// dynamics. That algorithm is proprietary and unpublished.
//
// This module approximates the same 0–5 scale using Banister TRIMP with
// every constant anchored to published reference sessions:
//  - Aerobic TE: per-sample Banister TRIMP, mapped to 0–5 via a power-law
//    (exponent 0.25 per [Wenger1986]) anchored so that 1 hour at lactate
//    threshold ([Karvonen1957], [Swain1998]) produces TE 3.0 ("Improving").
//  - Anaerobic TE: time above VT2 (90% HRR per [Swain1998], [Stagno2007],
//    [ACSM2018]), anchored so that 6 minutes at VO2max ([Billat1999])
//    produces TE 3.0.
//  - Fitness scaling: CTL-based multiplier (1.0× at CTL 0, up to 2.0× at
//    CTL 200 per [Friel2009]) so fitter athletes need harder efforts.
//
// The output labels and 0–5 boundaries match Garmin's published scale, but
// individual values may diverge from a Garmin device because the underlying
// stimulus model is fundamentally different (TRIMP vs. EPOC).
// ---------------------------------------------------------------------------

import type { SessionRecord, Gender } from './types.ts';
import { BANISTER } from './stress.ts';

/**
 * Lactate threshold as fraction of heart rate reserve.
 * @see [Karvonen1957] — HRR method
 * @see [Swain1998] — LT occurs at ~88% HRR in trained athletes
 */
export const LT_HRR = 0.88;

/**
 * Second ventilatory threshold (VT2) as fraction of heart rate reserve.
 * Intensities above this are predominantly anaerobic.
 * @see [Swain1998], [Stagno2007], [ACSM2018]
 */
const VT2_HRR = 0.9;

/**
 * Sub-linear dose–response exponent for aerobic training adaptation.
 * @see [Wenger1986] — diminishing returns from extended duration
 */
const DIMINISHING_P = 0.25;

/**
 * Anchor point on the 0–5 TE scale: "Improving" threshold.
 * 1 hour at LT and 6 min at VO2max both map to this value.
 */
const TE_IMPROVING = 3.0;

/**
 * Mean time-to-exhaustion at vVO2max.
 * @see [Billat1999] — mean tlim ≈ 6 min in trained runners
 */
const T_LIM_VO2MAX = 6.0;

/**
 * Professional endurance athlete CTL ceiling used to bound fitness scaling.
 * @see [Friel2009] — CTL ranges for elite cyclists
 */
const CTL_MAX = 200;

/**
 * Compute the Banister TRIMP for the aerobic reference session:
 * 1 hour at lactate threshold (LT_HRR).
 */
const computeTrimpRef = (coeff: { a: number; b: number }): number =>
  60 * LT_HRR * coeff.a * Math.exp(coeff.b * LT_HRR);

/** Semantic key identifying a training effect band. */
export type TELabelKey =
  | 'overreaching'
  | 'highly_improving'
  | 'improving'
  | 'maintaining'
  | 'minor'
  | 'no_effect';

/** Semantic key identifying a training effect summary. */
export type TESummaryKey =
  | 'too_easy'
  | 'extreme'
  | 'steady_aerobic'
  | 'high_intensity'
  | 'mixed_intensity'
  | 'easy_maintenance'
  | 'moderate'
  | 'light';

/** Semantic label key and color token for a training effect score. */
type TrainingEffectLabel = {
  /** Semantic key for the training effect band. */
  label: TELabelKey;
  /** Tailwind color token representing the intensity of the training effect. */
  color: 'neutral' | 'blue' | 'green' | 'amber' | 'orange' | 'red';
};

/**
 * Accumulate per-sample Banister TRIMP across the full session to produce aerobic and anaerobic training effect scores.
 * @param records - Time-series session records; only records with an `hr` field contribute.
 * @param maxHr - Athlete's maximum heart rate in bpm.
 * @param restHr - Athlete's resting heart rate in bpm.
 * @param gender - Biological sex used to select the Banister gender coefficient.
 * @param ctl - Current chronic training load; scales the fitness baseline so fitter athletes require more stimulus.
 * @returns Object with `aerobic` and `anaerobic` scores on a 0–5 scale, or `undefined` when no HR data is present or `maxHr <= restHr`.
 */
export const calculateTrainingEffect = (
  records: SessionRecord[],
  maxHr: number,
  restHr: number,
  gender: Gender,
  ctl: number,
): { aerobic: number; anaerobic: number } | undefined => {
  if (maxHr <= restHr) return undefined;

  const hrRange = maxHr - restHr;
  let banisterKey: 'female' | 'male' = 'male';
  if (gender === 'female') {
    banisterKey = 'female';
  }
  const coeff = BANISTER[banisterKey];

  let aerobicTrimp = 0;
  let anaerobicImpulse = 0;
  let prevTimestamp: number | undefined;
  let hasHr = false;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record || record.hr === undefined) continue;

    hasHr = true;
    const hrr = Math.max(0, Math.min(1, (record.hr - restHr) / hrRange));
    let dt = 1 / 60; // assume 1s for first record
    if (prevTimestamp !== undefined) {
      dt = (record.timestamp - prevTimestamp) / 60;
    }
    prevTimestamp = record.timestamp;

    if (dt <= 0) continue;

    // Aerobic TRIMP: per-sample Banister
    aerobicTrimp += dt * hrr * coeff.a * Math.exp(coeff.b * hrr);

    // Anaerobic impulse: intensity above VT2, normalized by (1.0 - VT2_HRR)
    if (hrr > VT2_HRR) {
      anaerobicImpulse += (dt * (hrr - VT2_HRR)) / (1.0 - VT2_HRR);
    }
  }

  if (!hasHr) return undefined;

  // Fitness scaling: CTL 0 → 1.0x, CTL 200 → 2.0x
  const fitnessScale = 1 + Math.max(0, Math.min(CTL_MAX, ctl)) / CTL_MAX;

  // Aerobic TE: reference-anchored power-law with diminishing returns
  const trimpRef = computeTrimpRef(coeff);
  const aerobic = Math.max(
    0,
    Math.min(5, TE_IMPROVING * Math.pow(aerobicTrimp / (trimpRef * fitnessScale), DIMINISHING_P)),
  );

  // Anaerobic TE: reference-anchored linear scaling
  const anaerobic = Math.max(
    0,
    Math.min(5, (TE_IMPROVING * anaerobicImpulse) / (T_LIM_VO2MAX * fitnessScale)),
  );

  return {
    aerobic: Math.round(aerobic * 10) / 10,
    anaerobic: Math.round(anaerobic * 10) / 10,
  };
};

/**
 * Map a 0–5 training effect value to a human-readable label and Tailwind color token matching Garmin's industry-standard scale.
 * @param te - Training effect score in the range 0–5.
 * @returns `TrainingEffectLabel` containing a descriptive `label` string and a semantic `color` token.
 */
export const getTrainingEffectLabel = (te: number): TrainingEffectLabel => {
  if (te >= 5.0) return { label: 'overreaching', color: 'red' };
  if (te >= 4.0) return { label: 'highly_improving', color: 'orange' };
  if (te >= 3.0) return { label: 'improving', color: 'amber' };
  if (te >= 2.0) return { label: 'maintaining', color: 'green' };
  if (te >= 1.0) return { label: 'minor', color: 'blue' };
  return { label: 'no_effect', color: 'neutral' };
};

/**
 * Generate a short, plain-language interpretation combining aerobic and anaerobic training effect scores.
 * @param aerobic - Aerobic training effect score (0–5).
 * @param anaerobic - Anaerobic training effect score (0–5).
 * @returns A single sentence describing the dominant physiological stimulus of the session.
 */
export const getTrainingEffectSummary = (aerobic: number, anaerobic: number): TESummaryKey => {
  if (aerobic < 1.0 && anaerobic < 1.0) return 'too_easy';
  if (aerobic >= 4.0 && anaerobic >= 4.0) return 'extreme';
  if (aerobic >= 3.0 && anaerobic < 2.0) return 'steady_aerobic';
  if (anaerobic >= 3.0 && aerobic < 2.0) return 'high_intensity';
  if (aerobic >= 3.0 && anaerobic >= 2.0) return 'mixed_intensity';
  if (aerobic >= 2.0 && anaerobic < 1.0) return 'easy_maintenance';
  if (aerobic >= 2.0) return 'moderate';
  return 'light';
};
