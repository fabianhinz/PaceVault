// Sources: [Banister1991], [Karvonen1957], [Swain1998], [Billat1999], [Wenger1986]
// See packages/engine/SOURCES.md for full citations.

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

import type { SessionRecord, StressThresholds } from './types.ts';
import {
  BANISTER_BY_GENDER,
  banisterImpulse,
  hrReserveSamples,
  thresholdHrRatio,
} from './stress.ts';

type TrainingEffectThresholds = Pick<
  StressThresholds,
  'restHr' | 'maxHr' | 'gender' | 'thresholdHr'
>;

export type TrainingEffectLabel =
  | 'overreaching'
  | 'highly_improving'
  | 'improving'
  | 'maintaining'
  | 'minor'
  | 'no_effect';

export type TrainingEffectSummary =
  | 'too_easy'
  | 'extreme'
  | 'steady_aerobic'
  | 'high_intensity'
  | 'mixed_intensity'
  | 'easy_maintenance'
  | 'moderate'
  | 'light';

/**
 * Second ventilatory threshold (VT2) as fraction of heart rate reserve, used when no
 * threshold HR is set. Intensities above this are predominantly anaerobic.
 * @see [Swain1998], [Stagno2007], [ACSM2018]
 */
const VT2_HRR = 0.9;

/**
 * Sub-linear dose–response exponent for aerobic training adaptation.
 * @see [Wenger1986] — diminishing returns from extended duration
 */
const AEROBIC_DOSE_RESPONSE_EXPONENT = 0.25;

/**
 * Anchor point on the 0–5 TE scale: "Improving" threshold.
 * 1 hour at LT and 6 min at VO2max both map to this value.
 */
const TRAINING_EFFECT_IMPROVING = 3.0;

const TRAINING_EFFECT_SCALE_MAX = 5;
const TRAINING_EFFECT_OVERREACHING = 5;
const TRAINING_EFFECT_HIGHLY_IMPROVING = 4;
const TRAINING_EFFECT_MAINTAINING = 2;
const TRAINING_EFFECT_MINOR = 1;

/**
 * Mean time-to-exhaustion at vVO2max.
 * @see [Billat1999] — mean tlim ≈ 6 min in trained runners
 */
const T_LIM_VO2MAX_MIN = 6.0;

/**
 * Professional endurance athlete CTL ceiling used to bound fitness scaling.
 * @see [Friel2009] — CTL ranges for elite cyclists
 */
const CTL_MAX = 200;

const referenceTrimp = ({
  coeff,
  threshold,
}: {
  coeff: { a: number; b: number };
  threshold: number;
}): number => 60 * threshold * coeff.a * Math.exp(coeff.b * threshold);

const anaerobicLine = (thresholds: TrainingEffectThresholds): number => {
  if (thresholds.thresholdHr === undefined) return VT2_HRR;
  return thresholdHrRatio(thresholds);
};

const anaerobicImpulseOf = ({
  samples,
  line,
}: {
  samples: ReturnType<typeof hrReserveSamples>;
  line: number;
}): number => {
  let anaerobicImpulse = 0;
  for (const sample of samples) {
    if (sample.reserveShare > line) {
      anaerobicImpulse += (sample.durationMin * (sample.reserveShare - line)) / (1.0 - line);
    }
  }
  return anaerobicImpulse;
};

const fitnessScaleOf = (ctl: number): number => 1 + Math.max(0, Math.min(CTL_MAX, ctl)) / CTL_MAX;

const aerobicScore = ({
  aerobicTrimp,
  trimpRef,
  fitnessScale,
}: {
  aerobicTrimp: number;
  trimpRef: number;
  fitnessScale: number;
}): number =>
  Math.max(
    0,
    Math.min(
      TRAINING_EFFECT_SCALE_MAX,
      TRAINING_EFFECT_IMPROVING *
        Math.pow(aerobicTrimp / (trimpRef * fitnessScale), AEROBIC_DOSE_RESPONSE_EXPONENT),
    ),
  );

const anaerobicScore = ({
  anaerobicImpulse,
  fitnessScale,
}: {
  anaerobicImpulse: number;
  fitnessScale: number;
}): number =>
  Math.max(
    0,
    Math.min(
      TRAINING_EFFECT_SCALE_MAX,
      (TRAINING_EFFECT_IMPROVING * anaerobicImpulse) / (T_LIM_VO2MAX_MIN * fitnessScale),
    ),
  );

/** Pauses (records more than 10 s apart) don't count, like the HR load. */
export const trainingEffectFromRecords = ({
  records,
  thresholds,
  ctl,
}: {
  records: SessionRecord[];
  thresholds: TrainingEffectThresholds;
  ctl: number;
}): { aerobic: number; anaerobic: number } | undefined => {
  if (thresholds.maxHr <= thresholds.restHr) return undefined;

  const samples = hrReserveSamples({ records, restHr: thresholds.restHr, maxHr: thresholds.maxHr });
  if (samples.length === 0) return undefined;

  const coeff = BANISTER_BY_GENDER[thresholds.gender];

  const aerobicTrimp = banisterImpulse({ samples, gender: thresholds.gender });
  const line = anaerobicLine(thresholds);
  const anaerobicImpulse = anaerobicImpulseOf({ samples, line });

  const fitnessScale = fitnessScaleOf(ctl);

  const trimpRef = referenceTrimp({ coeff, threshold: thresholdHrRatio(thresholds) });
  const aerobic = aerobicScore({ aerobicTrimp, trimpRef, fitnessScale });

  const anaerobic = anaerobicScore({ anaerobicImpulse, fitnessScale });

  return {
    aerobic: Math.round(aerobic * 10) / 10,
    anaerobic: Math.round(anaerobic * 10) / 10,
  };
};

export const trainingEffectLabel = (te: number): TrainingEffectLabel => {
  if (te >= TRAINING_EFFECT_OVERREACHING) return 'overreaching';
  if (te >= TRAINING_EFFECT_HIGHLY_IMPROVING) return 'highly_improving';
  if (te >= TRAINING_EFFECT_IMPROVING) return 'improving';
  if (te >= TRAINING_EFFECT_MAINTAINING) return 'maintaining';
  if (te >= TRAINING_EFFECT_MINOR) return 'minor';
  return 'no_effect';
};

export const trainingEffectSummary = ({
  aerobic,
  anaerobic,
}: {
  aerobic: number;
  anaerobic: number;
}): TrainingEffectSummary => {
  if (aerobic < TRAINING_EFFECT_MINOR && anaerobic < TRAINING_EFFECT_MINOR) return 'too_easy';
  if (aerobic >= TRAINING_EFFECT_HIGHLY_IMPROVING && anaerobic >= TRAINING_EFFECT_HIGHLY_IMPROVING)
    return 'extreme';
  if (aerobic >= TRAINING_EFFECT_IMPROVING && anaerobic < TRAINING_EFFECT_MAINTAINING)
    return 'steady_aerobic';
  if (anaerobic >= TRAINING_EFFECT_IMPROVING && aerobic < TRAINING_EFFECT_MAINTAINING)
    return 'high_intensity';
  if (aerobic >= TRAINING_EFFECT_IMPROVING && anaerobic >= TRAINING_EFFECT_MAINTAINING)
    return 'mixed_intensity';
  if (aerobic >= TRAINING_EFFECT_MAINTAINING && anaerobic < TRAINING_EFFECT_MINOR)
    return 'easy_maintenance';
  if (aerobic >= TRAINING_EFFECT_MAINTAINING) return 'moderate';
  return 'light';
};
