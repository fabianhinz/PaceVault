// Sources: [Banister1991], [Karvonen1957], [Swain1998], [Billat1999], [Wenger1986]
// See packages/engine/SOURCES.md for full citations.

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
//    threshold (the threshold HR, else 88% HRR per [Karvonen1957],
//    [Swain1998]) produces TE 3.0 ("Improving").
//  - Anaerobic TE: time above the threshold HR when set, else above VT2
//    (90% HRR per [Swain1998], [Stagno2007], [ACSM2018]), anchored so that
//    6 minutes at VO2max ([Billat1999]) produces TE 3.0.
//  - Fitness scaling: CTL-based multiplier (1.0× at CTL 0, up to 2.0× at
//    CTL 200 per [Friel2009]) so fitter athletes need harder efforts.
//
// The output labels and 0–5 boundaries match Garmin's published scale, but
// individual values may diverge from a Garmin device because the underlying
// stimulus model is fundamentally different (TRIMP vs. EPOC).
// ---------------------------------------------------------------------------

import type { SessionRecord } from './types.ts';
import {
  BANISTER,
  banisterImpulse,
  hrReserveSamples,
  thresholdHrRatio,
  type StressThresholds,
} from './stress.ts';

export type TrainingEffectThresholds = Pick<
  StressThresholds,
  'restHr' | 'maxHr' | 'gender' | 'thresholdHr'
>;

/**
 * Second ventilatory threshold (VT2) as fraction of heart rate reserve, used when no
 * threshold HR is set. Intensities above this are predominantly anaerobic.
 * @see [Swain1998], [Stagno2007], [ACSM2018]
 */
export const VT2_HRR = 0.9;

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
 * 1 hour at lactate threshold (the threshold HR ratio).
 */
const computeTrimpRef = (coeff: { a: number; b: number }, threshold: number): number =>
  60 * threshold * coeff.a * Math.exp(coeff.b * threshold);

/** The anaerobic line: threshold HR when set, VT2 at 90% of HR reserve otherwise. */
const anaerobicLine = (thresholds: TrainingEffectThresholds): number => {
  if (thresholds.thresholdHr === undefined) return VT2_HRR;
  return thresholdHrRatio(thresholds);
};

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
 * Pauses (records more than 10 s apart) don't count, like the HR load.
 * @param records - Time-series session records; only records with an `hr` field contribute.
 * @param thresholds - Rest HR, max HR, gender and optional threshold HR valid at the session date.
 * @param ctl - Current chronic training load; scales the fitness baseline so fitter athletes require more stimulus.
 * @returns Object with `aerobic` and `anaerobic` scores on a 0–5 scale, or `undefined` when no HR data is present or `maxHr <= restHr`.
 */
export const calculateTrainingEffect = (
  records: SessionRecord[],
  thresholds: TrainingEffectThresholds,
  ctl: number,
): { aerobic: number; anaerobic: number } | undefined => {
  if (thresholds.maxHr <= thresholds.restHr) return undefined;

  const samples = hrReserveSamples(records, thresholds.restHr, thresholds.maxHr);
  if (samples.length === 0) return undefined;

  let banisterKey: 'female' | 'male' = 'male';
  if (thresholds.gender === 'female') {
    banisterKey = 'female';
  }
  const coeff = BANISTER[banisterKey];

  const aerobicTrimp = banisterImpulse(samples, thresholds.gender);
  const line = anaerobicLine(thresholds);
  let anaerobicImpulse = 0;
  for (const sample of samples) {
    // Anaerobic impulse: intensity above the anaerobic line, normalized by its distance to max
    if (sample.ratio > line) {
      anaerobicImpulse += (sample.minutes * (sample.ratio - line)) / (1.0 - line);
    }
  }

  // Fitness scaling: CTL 0 → 1.0x, CTL 200 → 2.0x
  const fitnessScale = 1 + Math.max(0, Math.min(CTL_MAX, ctl)) / CTL_MAX;

  // Aerobic TE: reference-anchored power-law with diminishing returns
  const trimpRef = computeTrimpRef(coeff, thresholdHrRatio(thresholds));
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
