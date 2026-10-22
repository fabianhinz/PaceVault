// Sources: [Gabbett2016], [Friel2009], [TP-PMC]
// See packages/engine/SOURCES.md for full citations.

import type { FormStatus, InjuryRisk, LoadState } from './types.ts';

// ---------------------------------------------------------------------------
// TSB thresholds for form classification
// ---------------------------------------------------------------------------

/** TSB above this value indicates detraining risk. */
const TSB_DETRAINING = 25;
/** TSB at or above this value indicates a fresh/race-ready state. */
const TSB_FRESH = 5;
/** TSB at or above this value indicates a neutral training balance. */
const TSB_NEUTRAL = -10;
/** TSB at or above this value indicates productive overload. */
const TSB_OPTIMAL = -30;

/**
 * Classify athlete readiness from Training Stress Balance.
 * @param tsb - Training Stress Balance (CTL − ATL).
 * @returns The form status bucket the athlete falls into.
 */
export const getFormStatus = (tsb: number): FormStatus => {
  if (tsb > TSB_DETRAINING) return 'detraining';
  if (tsb >= TSB_FRESH) return 'fresh';
  if (tsb >= TSB_NEUTRAL) return 'neutral';
  if (tsb >= TSB_OPTIMAL) return 'optimal';
  return 'overload';
};

// ---------------------------------------------------------------------------
// Shared ACWR thresholds
// ---------------------------------------------------------------------------

/** ACWR below this value flags undertraining. */
const ACWR_UNDERTRAINING_THRESHOLD = 0.8;
/** ACWR above this value flags moderate injury risk. */
const ACWR_MODERATE_THRESHOLD = 1.3;
/** ACWR above this value flags high injury risk. */
const ACWR_HIGH_THRESHOLD = 1.5;

// ---------------------------------------------------------------------------
// Data maturity thresholds (days)
// ---------------------------------------------------------------------------

/** Minimum days of data before metrics are considered meaningful. */
const DATA_MATURITY_MIN_DAYS = 21;
/** Days of data required for full coaching confidence. */
const DATA_MATURITY_FULL_DAYS = 28;

/**
 * Classify training load state from ACWR and data history length.
 * @param acwr - Acute-to-Chronic Workload Ratio (ATL / CTL).
 * @param dataMaturityDays - Number of days of recorded training history.
 * @returns The load state classification.
 */
export const getLoadState = (acwr: number, dataMaturityDays: number): LoadState => {
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

/**
 * Map ACWR to an injury risk tier.
 * @param acwr - Acute-to-Chronic Workload Ratio.
 * @returns `'low'`, `'moderate'`, or `'high'`.
 */
export const getInjuryRisk = (acwr: number): InjuryRisk => {
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'low';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'moderate';
  return 'high';
};

/**
 * Map ACWR to a traffic-light color token for UI rendering.
 * @param acwr - Acute-to-Chronic Workload Ratio.
 * @returns `'green'`, `'yellow'`, or `'red'`.
 */
export const getACWRColor = (acwr: number): 'green' | 'yellow' | 'red' => {
  if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'yellow';
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'green';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'yellow';
  return 'red';
};
