import { tokens } from './tokens';

/** Tailwind text classes for coaching status */
export const statusTextClass: Record<string, string> = {
  detraining: 'text-status-warning',
  fresh: 'text-status-success',
  neutral: 'text-text-secondary',
  optimal: 'text-accent-hover',
  overload: 'text-status-danger',
};

/** Raw hex fills for Recharts (coaching status) */
export const statusFill: Record<string, string> = {
  detraining: tokens.statusWarning,
  fresh: tokens.statusSuccessStrong,
  neutral: tokens.statusNeutral,
  optimal: tokens.accent,
  overload: tokens.statusDangerStrong,
};

/** ACWR traffic-light color sets */
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
};

/** Raw hex fills for Recharts (ACWR traffic-light) */
export const acwrFill = {
  green: tokens.statusSuccessStrong,
  yellow: tokens.statusWarningStrong,
  red: tokens.statusDangerStrong,
};

/** Gauge arc zones for the ACWR dial */
export const ACWR_ZONES = [
  { from: 0, to: 0.8, color: tokens.statusNeutral },
  { from: 0.8, to: 1.3, color: tokens.statusSuccessStrong },
  { from: 1.3, to: 1.5, color: tokens.statusWarningStrong },
  { from: 1.5, to: 2.0, color: tokens.statusDangerStrong },
];

/** Sport identification colors — Tailwind classes */
export const sportColorClass: Record<string, string> = {
  running: 'bg-sport-running-muted text-sport-running',
  cycling: 'bg-sport-cycling-muted text-sport-cycling',
};

/** Sport icon watermark classes — very subtle tinted icon */
export const sportIconWatermarkClass: Record<string, string> = {
  running: 'text-sport-running/10',
  cycling: 'text-sport-cycling/10',
};
