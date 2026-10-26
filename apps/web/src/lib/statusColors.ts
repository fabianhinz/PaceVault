import { tokens } from '@pacevault/ui/lib/tokens.ts';
import {
  ACWR_HIGH_THRESHOLD,
  ACWR_MODERATE_THRESHOLD,
  ACWR_UNDERTRAINING_THRESHOLD,
} from '@pacevault/engine/coaching.ts';
import type { FormStatus, Sport } from '@pacevault/engine/types.ts';

export type AcwrColor = 'green' | 'yellow' | 'red';

export const statusTextClass: Record<FormStatus, string> = {
  detraining: 'text-status-warning',
  fresh: 'text-status-success',
  neutral: 'text-text-secondary',
  optimal: 'text-accent-hover',
  overload: 'text-status-danger',
};

export const statusFill: Record<FormStatus, string> = {
  detraining: tokens.statusWarning,
  fresh: tokens.statusSuccessStrong,
  neutral: tokens.statusNeutral,
  optimal: tokens.accent,
  overload: tokens.statusDangerStrong,
};

export const acwrColorMap = {
  green: {
    bg: 'bg-status-success-strong',
    text: 'text-status-success',
    ring: 'ring-status-success-strong/20',
  },
  yellow: {
    bg: 'bg-status-warning-strong',
    text: 'text-status-warning',
    ring: 'ring-status-warning-strong/20',
  },
  red: {
    bg: 'bg-status-danger-strong',
    text: 'text-status-danger',
    ring: 'ring-status-danger-strong/20',
  },
} satisfies Record<AcwrColor, { bg: string; text: string; ring: string }>;

export const acwrColor = (acwr: number): AcwrColor => {
  if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'yellow';
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'green';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'yellow';
  return 'red';
};

export const acwrFill = {
  green: tokens.statusSuccessStrong,
  yellow: tokens.statusWarningStrong,
  red: tokens.statusDangerStrong,
} satisfies Record<AcwrColor, string>;

/** Gauge arc zones for the ACWR dial */
export const ACWR_ZONES = [
  { from: 0, to: 0.8, color: tokens.statusNeutral },
  { from: 0.8, to: 1.3, color: tokens.statusSuccessStrong },
  { from: 1.3, to: 1.5, color: tokens.statusWarningStrong },
  { from: 1.5, to: 2.0, color: tokens.statusDangerStrong },
];

export const sportColorClass: Record<Sport, string> = {
  running: 'bg-sport-running-muted text-sport-running',
  cycling: 'bg-sport-cycling-muted text-sport-cycling',
};
