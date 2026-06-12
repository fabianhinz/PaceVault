import { m } from '@/paraglide/messages.js';
import type { TrainingSession } from '@/packages/engine/types.ts';

export const hoursToSeconds = (hours: number): number => Math.round(hours * 3600);

export const secondsToHours = (seconds: number): number => {
  return Math.round((seconds / 3600) * 100) / 100;
};

export const kmToMetres = (km: number): number => Math.round(km * 1000);

export const metresToKm = (metres: number): number => Math.round(metres / 10) / 100;

/** The session subset attribute filters operate on. */
export type AttributeSession = Pick<TrainingSession, 'duration' | 'distance' | 'elevationGain'>;

interface AttributeConfig {
  /** Relative half-window as a fraction of the target. */
  tolerance: number;
  /** Absolute half-window floor in canonical units — keeps small targets usable. */
  minWindow: number;
  /** Display unit → canonical unit (e.g. hours → seconds). */
  toCanonical: (display: number) => number;
  /** Canonical unit → display unit. */
  toDisplay: (canonical: number) => number;
  /** Reads the attribute from a session; defaulting of missing optional fields lives here. */
  read: (session: AttributeSession) => number;
  /** Input row label. */
  label: () => string;
  /** Input row placeholder, in display units. */
  placeholder: string;
}

/**
 * Single source of truth per filterable attribute. Adding an attribute means:
 * one entry here, one field read in `AttributeSession`, one i18n label key.
 */
export const ATTRIBUTE_CONFIG = {
  duration: {
    // sessions overshoot plans routinely — loosest relative band
    tolerance: 0.2,
    minWindow: 600,
    toCanonical: hoursToSeconds,
    toDisplay: secondsToHours,
    read: (session) => session.duration,
    label: m.ui_attr_dialog_duration,
    placeholder: '1.5',
  },
  distance: {
    // distances are nominal (5k, 10k …) — tightest band, small floor for short runs
    tolerance: 0.15,
    minWindow: 500,
    toCanonical: kmToMetres,
    toDisplay: metresToKm,
    read: (session) => session.distance,
    label: m.ui_attr_dialog_distance,
    placeholder: '10',
  },
  elevationGain: {
    // gain measurement varies 10–20% between devices — loosest band overall
    tolerance: 0.25,
    minWindow: 150,
    toCanonical: (n) => n,
    toDisplay: (n) => n,
    read: (session) => session.elevationGain ?? 0,
    label: m.ui_attr_dialog_elevation,
    placeholder: '500',
  },
} satisfies Record<string, AttributeConfig>;

export type AttributeFilterKey = keyof typeof ATTRIBUTE_CONFIG;

/** Target per attribute in canonical units; null = inactive. */
export type AttributeFilters = Record<AttributeFilterKey, number | null>;

export const ATTRIBUTE_FILTER_KEYS = Object.keys(ATTRIBUTE_CONFIG) as AttributeFilterKey[];

export const createEmptyAttributeFilters = (): AttributeFilters => {
  const entries = ATTRIBUTE_FILTER_KEYS.map((key) => [key, null] as const);
  return Object.fromEntries(entries) as AttributeFilters;
};

const sanitizeTarget = (value: number | null): number | null => {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
};

export const sanitizeAttributeFilters = (filters: AttributeFilters): AttributeFilters => {
  const entries = ATTRIBUTE_FILTER_KEYS.map((key) => [key, sanitizeTarget(filters[key])] as const);
  return Object.fromEntries(entries) as AttributeFilters;
};

export const isAttributeFilterActive = (filters: AttributeFilters): boolean => {
  return ATTRIBUTE_FILTER_KEYS.some((key) => typeof filters[key] === 'number');
};

export const fuzzyBounds = (
  key: AttributeFilterKey,
  target: number,
): { min: number; max: number } => {
  const config = ATTRIBUTE_CONFIG[key];
  const window = Math.max(target * config.tolerance, config.minWindow);
  return { min: Math.max(0, target - window), max: target + window };
};

export const matchesFuzzy = (
  value: number,
  key: AttributeFilterKey,
  target: number | null,
): boolean => {
  // typeof guard instead of a null check: persisted filter state from before a
  // key was added lacks that key entirely, so target can be undefined at runtime
  if (typeof target !== 'number') {
    return true;
  }
  const bounds = fuzzyBounds(key, target);
  return value >= bounds.min && value <= bounds.max;
};

export const matchesAttributeFilters = (
  session: AttributeSession,
  filters: AttributeFilters,
): boolean => {
  return ATTRIBUTE_FILTER_KEYS.every((key) =>
    matchesFuzzy(ATTRIBUTE_CONFIG[key].read(session), key, filters[key]),
  );
};

export const parseDecimalInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const normalized = trimmed.replace(',', '.');
  const value = Number(normalized);
  return sanitizeTarget(value);
};
