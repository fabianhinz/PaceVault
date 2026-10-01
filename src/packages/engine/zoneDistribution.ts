// Sources: [Karvonen1957], [CogganAllen2010]
// See src/engine/SOURCES.md for full citations.

import type { SessionRecord } from './types.ts';
import { computeRunningZones, getZoneForPace } from './zones.ts';
import type { EngineFormatter } from './formatter.ts';
import { defaultFormatter } from './formatter.ts';

/**
 * A single training-zone bucket produced by a zone-distribution computation.
 */
export interface ZoneBucket {
  /** Short zone identifier, e.g. `"Z1"` or `"Z4"`. */
  zone: string;
  /** Stable snake_case name key used for translation look-up, e.g. `"aerobic"` or `"active_recovery"`. */
  name: string;
  /** Human-readable label combining the zone id and name, e.g. `"Z2 Aerobic"`. */
  label: string;
  /** Number of data-point samples (records) that fell into this zone. */
  seconds: number;
  /** Proportion of total valid samples in this zone, expressed as a percentage (0–100, one decimal). */
  percentage: number;
  /** Hex colour string used to represent this zone in charts. */
  color: string;
  /** Formatted intensity range for display, e.g. `"130–148 bpm"` or `"3:45–4:10 /km"`. */
  rangeLabel: string;
}

// --- HR Zones (5-zone model based on % of HR reserve) ---

export const HR_ZONE_DEFS = [
  { zone: 'Z1', name: 'recovery', label: 'Recovery', minPct: 0.5, maxPct: 0.6, color: '#60a5fa' },
  { zone: 'Z2', name: 'aerobic', label: 'Aerobic', minPct: 0.6, maxPct: 0.7, color: '#34d399' },
  { zone: 'Z3', name: 'tempo', label: 'Tempo', minPct: 0.7, maxPct: 0.8, color: '#fbbf24' },
  { zone: 'Z4', name: 'threshold', label: 'Threshold', minPct: 0.8, maxPct: 0.9, color: '#f97316' },
  { zone: 'Z5', name: 'vo2max', label: 'VO2max', minPct: 0.9, maxPct: 1.0, color: '#ef4444' },
];

/**
 * Computes a 5-zone heart-rate distribution using the Karvonen (HR-reserve) method.
 *
 * @param records - Time-series session records; records without `hr` are skipped.
 * @param maxHr - Athlete's maximum heart rate in bpm.
 * @param restHr - Athlete's resting heart rate in bpm.
 * @returns One `ZoneBucket` per HR zone (Z1–Z5), or an empty array when inputs are insufficient.
 */
export const computeHrZoneDistribution = (
  records: SessionRecord[],
  maxHr: number,
  restHr: number,
): ZoneBucket[] => {
  const hrReserve = maxHr - restHr;
  if (hrReserve <= 0) return [];

  const hrRecords = records.map((r) => r.hr).filter((v): v is number => v !== undefined);
  if (hrRecords.length === 0) return [];

  const counts = HR_ZONE_DEFS.map(() => 0);
  const firstZone = HR_ZONE_DEFS[0];

  for (const hr of hrRecords) {
    const pct = (hr - restHr) / hrReserve;
    const idx = HR_ZONE_DEFS.findIndex((z) => pct >= z.minPct && pct < z.maxPct);
    if (idx >= 0) {
      counts[idx] = (counts[idx] ?? 0) + 1;
    } else if (pct >= 1.0) {
      const lastIdx = counts.length - 1;
      counts[lastIdx] = (counts[lastIdx] ?? 0) + 1; // cap at Z5
    } else if (firstZone && pct < firstZone.minPct) {
      counts[0] = (counts[0] ?? 0) + 1; // bin sub-Z1 into Z1
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return HR_ZONE_DEFS.map((def, i) => ({
    zone: def.zone,
    name: def.name,
    label: `${def.zone} ${def.label}`,
    seconds: counts[i] ?? 0,
    percentage: Math.round(((counts[i] ?? 0) / total) * 1000) / 10,
    color: def.color,
    rangeLabel: `${Math.round(restHr + hrReserve * def.minPct)}–${Math.round(restHr + hrReserve * def.maxPct)} bpm`,
  }));
};

// --- Power Zones (7-zone Coggan model based on % FTP) ---

export const POWER_ZONE_DEFS = [
  {
    zone: 'Z1',
    name: 'active_recovery',
    label: 'Active Recovery',
    minPct: 0,
    maxPct: 0.55,
    color: '#94a3b8',
  },
  {
    zone: 'Z2',
    name: 'endurance',
    label: 'Endurance',
    minPct: 0.55,
    maxPct: 0.75,
    color: '#60a5fa',
  },
  { zone: 'Z3', name: 'tempo', label: 'Tempo', minPct: 0.75, maxPct: 0.9, color: '#34d399' },
  {
    zone: 'Z4',
    name: 'threshold',
    label: 'Threshold',
    minPct: 0.9,
    maxPct: 1.05,
    color: '#fbbf24',
  },
  { zone: 'Z5', name: 'vo2max', label: 'VO2max', minPct: 1.05, maxPct: 1.2, color: '#f97316' },
  { zone: 'Z6', name: 'anaerobic', label: 'Anaerobic', minPct: 1.2, maxPct: 1.5, color: '#ef4444' },
  {
    zone: 'Z7',
    name: 'neuromuscular',
    label: 'Neuromuscular',
    minPct: 1.5,
    maxPct: Infinity,
    color: '#dc2626',
  },
];

/**
 * Computes a 7-zone power distribution using the Coggan FTP model.
 *
 * @param records - Time-series session records; records without `power` are skipped.
 * @param ftp - Athlete's Functional Threshold Power in watts.
 * @returns One `ZoneBucket` per power zone (Z1–Z7), or an empty array when inputs are insufficient.
 */
export const computePowerZoneDistribution = (
  records: SessionRecord[],
  ftp: number,
): ZoneBucket[] => {
  if (ftp <= 0) return [];

  const powerValues = records.map((r) => r.power).filter((v): v is number => v !== undefined);
  if (powerValues.length === 0) return [];

  const counts = POWER_ZONE_DEFS.map(() => 0);

  for (const power of powerValues) {
    const pct = power / ftp;
    const idx = POWER_ZONE_DEFS.findIndex((z) => pct >= z.minPct && pct < z.maxPct);
    if (idx >= 0) {
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return POWER_ZONE_DEFS.map((def, i) => {
    let rangeLabel = `${Math.round(ftp * def.minPct)}–${Math.round(ftp * def.maxPct)} W`;
    if (def.maxPct === Infinity) {
      rangeLabel = `>${Math.round(ftp * def.minPct)} W`;
    }
    return {
      zone: def.zone,
      name: def.name,
      label: `${def.zone} ${def.label}`,
      seconds: counts[i] ?? 0,
      percentage: Math.round(((counts[i] ?? 0) / total) * 1000) / 10,
      color: def.color,
      rangeLabel,
    };
  });
};

// --- Pace Zones (reuses computeRunningZones) ---

/**
 * Computes a pace-zone distribution derived from the athlete's running threshold pace.
 *
 * @param records - Time-series session records; records without `speed` or at speed 0 are skipped.
 * @param thresholdPace - Athlete's threshold pace in seconds per kilometre.
 * @returns One `ZoneBucket` per pace zone as defined by `computeRunningZones`, or an empty array when inputs are insufficient.
 */
export const computePaceZoneDistribution = (
  records: SessionRecord[],
  thresholdPace: number,
  formatter: EngineFormatter = defaultFormatter,
): ZoneBucket[] => {
  if (thresholdPace <= 0) return [];

  const zones = computeRunningZones(thresholdPace);
  const speedValues = records
    .map((r) => r.speed)
    .filter((v): v is number => v !== undefined && v > 0);
  if (speedValues.length === 0) return [];

  const counts = zones.map(() => 0);

  for (const speed of speedValues) {
    const paceSec = 1000 / speed; // sec/km
    const zone = getZoneForPace(paceSec, zones);
    if (zone) {
      const idx = zones.indexOf(zone);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return zones.map((z, i) => ({
    zone: z.name,
    name: z.name,
    label: z.label,
    seconds: counts[i] ?? 0,
    percentage: Math.round(((counts[i] ?? 0) / total) * 1000) / 10,
    color: z.color,
    rangeLabel: `${formatter.pace(z.maxPace)}–${formatter.pace(z.minPace)}`,
  }));
};
