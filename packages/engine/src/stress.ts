// Sources: [Banister1991], [CogganAllen2010], [Fellrnr], [Karvonen1957], [Swain1998]
// See packages/engine/SOURCES.md for full citations.

import type { SessionRecord, Gender, Sport } from './types.ts';
import { activeSeconds, calculateNormalizedPower } from './normalize.ts';

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
  /** Heart rate at lactate threshold in bpm; estimated at `DEFAULT_THRESHOLD_HRR` when missing. */
  thresholdHr?: number;
}

export type HrThresholds = Pick<StressThresholds, 'restHr' | 'maxHr' | 'thresholdHr'>;

export interface SessionStress {
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  normalizedPower?: number;
}

/** One stretch of heart rate: its length in minutes and its share of the HR reserve, 0–1. */
export interface HrReserveSample {
  minutes: number;
  ratio: number;
}

/**
 * Gender-specific Banister coefficients used in the TRIMP exponential weighting formula.
 * Male coefficients (a=0.64, b=1.92) are from Banister 1991 with strong consensus.
 * Female coefficients (b=1.67) are agreed upon; the `a` coefficient varies across
 * secondary sources (0.64 in Fellrnr/Veohtu, 0.86 in Intervals.icu and others).
 * We use 0.86 following the majority of contemporary implementations.
 * @see [Banister1991], [Fellrnr]
 */
export const BANISTER = {
  male: { a: 0.64, b: 1.92 },
  female: { a: 0.86, b: 1.67 },
} as const;

/**
 * Lactate threshold as a share of heart rate reserve, used when no threshold HR is set.
 * @see [Karvonen1957] — HRR method
 * @see [Swain1998] — LT occurs at ~88% HRR in trained athletes
 */
export const DEFAULT_THRESHOLD_HRR = 0.88;

/** The threshold ratio stays inside (0, 1), so an out-of-range threshold HR never divides by 0. */
export const THRESHOLD_HRR_MIN = 0.5;
export const THRESHOLD_HRR_MAX = 0.98;

/** Load per hour of a session without power or heart rate. */
export const DURATION_LOAD_PER_HOUR = 30;

const banisterFor = (gender: Gender): { a: number; b: number } => {
  if (gender === 'female') return BANISTER.female;
  return BANISTER.male;
};

const clampRatio = (ratio: number): number => Math.max(0, Math.min(1, ratio));

/** Banister impulse of one minute at `ratio` of the HR reserve. @see [Banister1991] */
const impulsePerMinute = (ratio: number, coeff: { a: number; b: number }): number =>
  ratio * coeff.a * Math.exp(coeff.b * ratio);

const durationStress = (durationSec: number): SessionStress => ({
  tss: Math.round((durationSec / 3600) * DURATION_LOAD_PER_HOUR),
  stressMethod: 'duration',
});

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
 * Banister impulse scaled so one hour at threshold HR scores 100, like one hour at FTP.
 * @see [Banister1991]
 */
const hrLoad = (impulse: number, thresholds: StressThresholds): number => {
  const threshold = thresholdHrRatio(thresholds);
  const reference = (60 * impulsePerMinute(threshold, banisterFor(thresholds.gender))) / 100;
  return Math.round((impulse / reference) * 10) / 10;
};

const tssFromPower = (
  sport: Sport,
  normalizedPower: number | undefined,
  durationSec: number,
  ftp: number | undefined,
): SessionStress | undefined => {
  if (sport !== 'cycling' || normalizedPower === undefined || ftp === undefined || ftp <= 0) {
    return undefined;
  }
  const tss = calculateTSS(normalizedPower, durationSec, ftp);
  if (tss === undefined) return undefined;
  return { tss, stressMethod: 'tss' };
};

/** TRIMP from the session's average HR, clamped to the HR reserve. @see [Banister1991] */
const averageHrStress = (
  avgHr: number,
  durationSec: number,
  thresholds: StressThresholds,
): SessionStress => {
  const ratio = clampRatio((avgHr - thresholds.restHr) / (thresholds.maxHr - thresholds.restHr));
  const impulse = (durationSec / 60) * impulsePerMinute(ratio, banisterFor(thresholds.gender));
  return { tss: hrLoad(impulse, thresholds), stressMethod: 'trimp' };
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
 * Threshold HR as a share of the HR reserve: (thresholdHr − rest) / (max − rest).
 * Without a threshold HR, or with max HR at or below rest HR, the estimate at 88% applies.
 * The ratio is clamped into (0, 1), so a later rest or max HR edit can't break the load.
 * @see [Karvonen1957], [Swain1998]
 */
export const thresholdHrRatio = (thresholds: HrThresholds): number => {
  const range = thresholds.maxHr - thresholds.restHr;
  if (thresholds.thresholdHr === undefined || range <= 0) return DEFAULT_THRESHOLD_HRR;
  const ratio = (thresholds.thresholdHr - thresholds.restHr) / range;
  return Math.max(THRESHOLD_HRR_MIN, Math.min(THRESHOLD_HRR_MAX, ratio));
};

/**
 * Heart rate per record as a share of the HR reserve, clamped to [0, 1]. Each record with HR
 * counts the seconds since the record before it; pairs more than 10 s apart (pauses) count 0,
 * like Normalized Power.
 * @see [Karvonen1957]
 */
export const hrReserveSamples = (
  records: SessionRecord[],
  restHr: number,
  maxHr: number,
): HrReserveSample[] => {
  const range = maxHr - restHr;
  if (range <= 0) return [];
  const samples: HrReserveSample[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    const seconds = activeSeconds(previous, current);
    if (seconds === 0) continue;
    samples.push({ minutes: seconds / 60, ratio: clampRatio((current.hr - restHr) / range) });
  }
  return samples;
};

/**
 * Banister impulse summed per sample: Σ minutes × r × a × e^(b × r).
 * @see [Banister1991]
 */
export const banisterImpulse = (samples: HrReserveSample[], gender: Gender): number => {
  const coeff = banisterFor(gender);
  let impulse = 0;
  for (const sample of samples) impulse += sample.minutes * impulsePerMinute(sample.ratio, coeff);
  return impulse;
};

/**
 * Calculate stress from stored summary fields (the metadata path, no records).
 * TSS needs a ride with NP and an FTP above 0; NP 0 W gives TSS 0. Runs never score TSS.
 * Otherwise the average HR scores TRIMP, otherwise a duration-based estimate is used.
 * @see [CogganAllen2010] [Banister1991]
 * @param sport - Sport of the session; only cycling scores TSS.
 * @param summary - Duration, average HR and Normalized Power of the session.
 * @param thresholds - Rest HR, max HR, gender, optional FTP and threshold HR valid at the session date.
 * @returns The stress score (`tss`) and the method used (`stressMethod`).
 */
export const calculateSummaryStress = (
  sport: Sport,
  summary: StressSummary,
  thresholds: StressThresholds,
): SessionStress => {
  const tss = tssFromPower(sport, summary.normalizedPower, summary.durationSec, thresholds.ftp);
  if (tss) return tss;
  if (summary.avgHr !== undefined && thresholds.maxHr > thresholds.restHr) {
    return averageHrStress(summary.avgHr, summary.durationSec, thresholds);
  }
  return durationStress(summary.durationSec);
};

/**
 * Calculate stress for a session from its records.
 * Rides with NP from the records and an FTP score TSS. Otherwise the HR records score the
 * Banister impulse per record (one hour at threshold HR = 100), otherwise the summary average
 * HR scores TRIMP, otherwise the duration estimate applies.
 * @see [CogganAllen2010] [Banister1991]
 * @param sport - Sport of the session; only cycling scores TSS.
 * @param records - Session records with power and/or HR samples.
 * @param summary - Duration and average HR of the session; its NP is replaced by the records' NP.
 * @param thresholds - Rest HR, max HR, gender, optional FTP and threshold HR valid at the session date.
 * @returns The stress score (`tss`), the method used (`stressMethod`), and `normalizedPower` whenever the records give one.
 */
export const calculateSessionStress = (
  sport: Sport,
  records: SessionRecord[],
  summary: StressSummary,
  thresholds: StressThresholds,
): SessionStress => {
  const normalizedPower = calculateNormalizedPower(records);
  const withPower = (stress: SessionStress): SessionStress => {
    if (normalizedPower === undefined) return stress;
    return { ...stress, normalizedPower };
  };

  const tss = tssFromPower(sport, normalizedPower, summary.durationSec, thresholds.ftp);
  if (tss) return withPower(tss);

  const samples = hrReserveSamples(records, thresholds.restHr, thresholds.maxHr);
  if (samples.length > 0) {
    const impulse = banisterImpulse(samples, thresholds.gender);
    return withPower({ tss: hrLoad(impulse, thresholds), stressMethod: 'trimp' });
  }

  return withPower(
    calculateSummaryStress(
      sport,
      { durationSec: summary.durationSec, avgHr: summary.avgHr },
      thresholds,
    ),
  );
};
