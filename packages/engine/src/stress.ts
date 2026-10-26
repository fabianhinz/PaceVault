// Sources: [Banister1991], [CogganAllen2010], [Fellrnr], [Karvonen1957], [Swain1998]
// See packages/engine/SOURCES.md for full citations.

import type { SessionRecord, Gender, Sport, StressThresholds } from './types.ts';
import { activeSeconds } from './recordPairs.ts';
import { normalizedPowerFromRecords } from './normalizedEffort.ts';

interface StressSummary {
  durationSec: number;
  avgHr?: number;
  normalizedPower?: number;
}

type HrThresholds = Pick<StressThresholds, 'restHr' | 'maxHr' | 'thresholdHr'>;

interface SessionStress {
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  normalizedPower?: number;
}

interface HrReserveSample {
  durationMin: number;
  reserveShare: number;
}

interface BanisterCoefficients {
  a: number;
  b: number;
}

/**
 * Gender-specific Banister coefficients used in the TRIMP exponential weighting formula.
 * Male coefficients (a=0.64, b=1.92) are from Banister 1991 with strong consensus.
 * Female coefficients (b=1.67) are agreed upon; the `a` coefficient varies across
 * secondary sources (0.64 in Fellrnr/Veohtu, 0.86 in Intervals.icu and others).
 * We use 0.86 following the majority of contemporary implementations.
 * @see [Banister1991], [Fellrnr]
 */
export const BANISTER_BY_GENDER: Record<Gender, BanisterCoefficients> = {
  male: { a: 0.64, b: 1.92 },
  female: { a: 0.86, b: 1.67 },
};

/**
 * Lactate threshold as a share of heart rate reserve, used when no threshold HR is set.
 * @see [Karvonen1957] — HRR method
 * @see [Swain1998] — LT occurs at ~88% HRR in trained athletes
 */
export const DEFAULT_THRESHOLD_HRR = 0.88;

/** The threshold ratio stays inside (0, 1), so an out-of-range threshold HR never divides by 0. */
const THRESHOLD_HRR_MIN = 0.5;
const THRESHOLD_HRR_MAX = 0.98;

const DURATION_LOAD_PER_HOUR = 30;

const clampRatio = (ratio: number): number => Math.max(0, Math.min(1, ratio));

/** @see [Banister1991] */
const impulsePerMinute = ({
  ratio,
  coeff,
}: {
  ratio: number;
  coeff: BanisterCoefficients;
}): number => ratio * coeff.a * Math.exp(coeff.b * ratio);

const durationStress = (durationSec: number): SessionStress => ({
  tss: Math.round((durationSec / 3600) * DURATION_LOAD_PER_HOUR),
  stressMethod: 'duration',
});

/** @see [CogganAllen2010] */
const trainingStressScore = ({
  np,
  durationSec,
  ftp,
}: {
  np: number;
  durationSec: number;
  ftp: number;
}): number | undefined => {
  const factor = intensityFactor({ np, ftp });
  if (factor === undefined) return undefined;
  const tss = ((durationSec * np * factor) / (ftp * 3600)) * 100;
  return Math.round(tss * 10) / 10;
};

/**
 * Banister impulse scaled so one hour at threshold HR scores 100, like one hour at FTP.
 * @see [Banister1991]
 */
const hrLoad = ({
  impulse,
  thresholds,
}: {
  impulse: number;
  thresholds: StressThresholds;
}): number => {
  const threshold = thresholdHrRatio(thresholds);
  const reference =
    (60 * impulsePerMinute({ ratio: threshold, coeff: BANISTER_BY_GENDER[thresholds.gender] })) /
    100;
  return Math.round((impulse / reference) * 10) / 10;
};

const tssFromPower = ({
  sport,
  normalizedPower,
  durationSec,
  ftp,
}: {
  sport: Sport;
  normalizedPower: number | undefined;
  durationSec: number;
  ftp: number | undefined;
}): SessionStress | undefined => {
  if (sport !== 'cycling' || normalizedPower === undefined || ftp === undefined || ftp <= 0) {
    return undefined;
  }
  const tss = trainingStressScore({ np: normalizedPower, durationSec, ftp });
  if (tss === undefined) return undefined;
  return { tss, stressMethod: 'tss' };
};

/** @see [Banister1991] */
const averageHrStress = ({
  avgHr,
  durationSec,
  thresholds,
}: {
  avgHr: number;
  durationSec: number;
  thresholds: StressThresholds;
}): SessionStress => {
  const ratio = clampRatio((avgHr - thresholds.restHr) / (thresholds.maxHr - thresholds.restHr));
  const impulse =
    (durationSec / 60) * impulsePerMinute({ ratio, coeff: BANISTER_BY_GENDER[thresholds.gender] });
  return { tss: hrLoad({ impulse, thresholds }), stressMethod: 'trimp' };
};

/** @see [CogganAllen2010] */
export const intensityFactor = ({ np, ftp }: { np: number; ftp: number }): number | undefined => {
  if (ftp <= 0) return undefined;
  return np / ftp;
};

/** @see [CogganAllen2010] */
export const variabilityIndex = ({
  np,
  avgPower,
}: {
  np: number;
  avgPower: number;
}): number | undefined => {
  if (avgPower <= 0) return undefined;
  return np / avgPower;
};

/** The ratio is clamped into (0, 1), so a later rest or max HR edit can't break the load. @see [Karvonen1957], [Swain1998] */
export const thresholdHrRatio = (thresholds: HrThresholds): number => {
  const range = thresholds.maxHr - thresholds.restHr;
  if (thresholds.thresholdHr === undefined || range <= 0) return DEFAULT_THRESHOLD_HRR;
  const ratio = (thresholds.thresholdHr - thresholds.restHr) / range;
  return Math.max(THRESHOLD_HRR_MIN, Math.min(THRESHOLD_HRR_MAX, ratio));
};

/** Pairs more than 10 s apart (pauses) count 0, like Normalized Power. @see [Karvonen1957] */
export const hrReserveSamples = ({
  records,
  restHr,
  maxHr,
}: {
  records: SessionRecord[];
  restHr: number;
  maxHr: number;
}): HrReserveSample[] => {
  const range = maxHr - restHr;
  if (range <= 0) return [];
  const samples: HrReserveSample[] = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    const durationSec = activeSeconds({ previous, current });
    if (durationSec === 0) continue;
    samples.push({
      durationMin: durationSec / 60,
      reserveShare: clampRatio((current.hr - restHr) / range),
    });
  }
  return samples;
};

/** @see [Banister1991] */
export const banisterImpulse = ({
  samples,
  gender,
}: {
  samples: HrReserveSample[];
  gender: Gender;
}): number => {
  const coeff = BANISTER_BY_GENDER[gender];
  let impulse = 0;
  for (const sample of samples)
    impulse += sample.durationMin * impulsePerMinute({ ratio: sample.reserveShare, coeff });
  return impulse;
};

/** NP 0 W gives TSS 0. Runs never score TSS. @see [CogganAllen2010] [Banister1991] */
export const stressFromSummary = ({
  sport,
  summary,
  thresholds,
}: {
  sport: Sport;
  summary: StressSummary;
  thresholds: StressThresholds;
}): SessionStress => {
  const tss = tssFromPower({
    sport,
    normalizedPower: summary.normalizedPower,
    durationSec: summary.durationSec,
    ftp: thresholds.ftp,
  });
  if (tss) return tss;
  if (summary.avgHr !== undefined && thresholds.maxHr > thresholds.restHr) {
    return averageHrStress({ avgHr: summary.avgHr, durationSec: summary.durationSec, thresholds });
  }
  return durationStress(summary.durationSec);
};

/** @see [CogganAllen2010] [Banister1991] */
export const stressFromRecords = ({
  sport,
  records,
  summary,
  thresholds,
}: {
  sport: Sport;
  records: SessionRecord[];
  summary: StressSummary;
  thresholds: StressThresholds;
}): SessionStress => {
  const normalizedPower = normalizedPowerFromRecords(records);
  const withPower = (stress: SessionStress): SessionStress => {
    if (normalizedPower === undefined) return stress;
    return { ...stress, normalizedPower };
  };

  const tss = tssFromPower({
    sport,
    normalizedPower,
    durationSec: summary.durationSec,
    ftp: thresholds.ftp,
  });
  if (tss) return withPower(tss);

  const samples = hrReserveSamples({ records, restHr: thresholds.restHr, maxHr: thresholds.maxHr });
  if (samples.length > 0) {
    const impulse = banisterImpulse({ samples, gender: thresholds.gender });
    return withPower({ tss: hrLoad({ impulse, thresholds }), stressMethod: 'trimp' });
  }

  return withPower(
    stressFromSummary({
      sport,
      summary: { durationSec: summary.durationSec, avgHr: summary.avgHr },
      thresholds,
    }),
  );
};
