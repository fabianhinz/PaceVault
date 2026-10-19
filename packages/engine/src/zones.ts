// Sources: [Daniels2013]
// See packages/engine/SOURCES.md for full citations.

import type { RunningZone, RunningZoneName } from './types.ts';

const ZONE_DEFS: {
  name: RunningZoneName;
  label: string;
  minPct: number; // slower boundary (higher %)
  maxPct: number; // faster boundary (lower %)
  color: string;
}[] = [
  { name: 'recovery', label: 'Recovery', minPct: 1.4, maxPct: 1.29, color: '#60a5fa' },
  { name: 'easy', label: 'Easy', minPct: 1.29, maxPct: 1.16, color: '#34d399' },
  { name: 'tempo', label: 'Tempo', minPct: 1.16, maxPct: 1.05, color: '#fbbf24' },
  { name: 'threshold', label: 'Threshold', minPct: 1.05, maxPct: 0.97, color: '#f97316' },
  { name: 'vo2max', label: 'VO2max', minPct: 0.97, maxPct: 0.86, color: '#ef4444' },
];

/**
 * Derives the five running training zones from a threshold pace.
 * @param thresholdPaceSec - Lactate-threshold pace in seconds per kilometre.
 * @returns Array of five {@link RunningZone} objects ordered from slowest (recovery) to fastest (VO2max).
 */
export const computeRunningZones = (thresholdPaceSec: number): RunningZone[] => {
  return ZONE_DEFS.map((def) => ({
    name: def.name,
    label: def.label,
    minPace: Math.round(thresholdPaceSec * def.minPct),
    maxPace: Math.round(thresholdPaceSec * def.maxPct),
    color: def.color,
  }));
};

/**
 * Returns the zone that contains the given pace, or `undefined` if none matches.
 * @param paceSec - Current pace in seconds per kilometre.
 * @param zones - Ordered zone array produced by {@link computeRunningZones}.
 * @returns The matching {@link RunningZone}, or `undefined` when the pace falls outside all zones.
 */
export const getZoneForPace = (paceSec: number, zones: RunningZone[]): RunningZone | undefined => {
  return zones.find((z) => paceSec <= z.minPace && paceSec >= z.maxPace);
};

/**
 * Computes the midpoint pace of a zone as a convenient representative value.
 * @param zone - A {@link RunningZone} with `minPace` and `maxPace` in seconds per kilometre.
 * @returns The arithmetic midpoint pace in seconds per kilometre, rounded to the nearest integer.
 */
export const getZoneMidPace = (zone: RunningZone): number => {
  return Math.round((zone.minPace + zone.maxPace) / 2);
};
