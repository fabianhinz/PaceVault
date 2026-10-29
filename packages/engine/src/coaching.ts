// Sources: [Gabbett2016], [Friel2009], [TP-PMC]
// See packages/engine/SOURCES.md for full citations.

import type { FormStatus, InjuryRisk, LoadState } from './types.ts';

const TSB_DETRAINING = 25;
const TSB_FRESH = 5;
const TSB_NEUTRAL = -10;
const TSB_OPTIMAL = -30;

export const ACWR_UNDERTRAINING_THRESHOLD = 0.8;
export const ACWR_MODERATE_THRESHOLD = 1.3;
export const ACWR_HIGH_THRESHOLD = 1.5;

const DATA_MATURITY_MIN_DAYS = 21;
const DATA_MATURITY_FULL_DAYS = 28;

export const formStatusFromTsb = (tsb: number): FormStatus => {
  if (tsb > TSB_DETRAINING) return 'detraining';
  if (tsb >= TSB_FRESH) return 'fresh';
  if (tsb >= TSB_NEUTRAL) return 'neutral';
  if (tsb >= TSB_OPTIMAL) return 'optimal';
  return 'overload';
};

export const loadStateFromAcwr = ({
  acwr,
  dataMaturityDays,
}: {
  acwr: number;
  dataMaturityDays: number;
}): LoadState => {
  if (dataMaturityDays < DATA_MATURITY_MIN_DAYS) return 'immature';
  if (dataMaturityDays < DATA_MATURITY_FULL_DAYS) {
    if (acwr > ACWR_HIGH_THRESHOLD) return 'high-risk';
    return 'transitioning';
  }
  if (acwr > ACWR_HIGH_THRESHOLD) return 'high-risk';
  if (acwr > ACWR_MODERATE_THRESHOLD) return 'moderate-risk';
  if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'undertraining';
  return 'sweet-spot';
};

export const injuryRiskFromAcwr = (acwr: number): InjuryRisk => {
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'low';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'moderate';
  return 'high';
};
