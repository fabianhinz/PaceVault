import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

/**
 * Derived metrics for a single lap computed from raw {@link SessionLap} data.
 */
export interface LapAnalysis {
  /** Zero-based position of this lap within the session. */
  lapIndex: number;
  /** Average pace in seconds per kilometre, or `undefined` when distance/time data is missing. */
  paceSecPerKm: number | undefined;
  /** Average heart rate in bpm, or `undefined` when the device did not record HR. */
  avgHr: number | undefined;
  /** Minimum heart rate in bpm during the lap, or `undefined` when not recorded. */
  minHr: number | undefined;
  /** Maximum heart rate in bpm during the lap, or `undefined` when not recorded. */
  maxHr: number | undefined;
  /** Average cadence in rpm/spm, or `undefined` when not recorded. */
  avgCadence: number | undefined;
  /** Total lap distance in metres, or `undefined` when not recorded. */
  distance: number | undefined;
  /** Elapsed (timer) duration of the lap in seconds. */
  duration: number;
  /** Moving time of the lap in seconds (excludes stopped periods when available). */
  movingTime: number;
  /** Total elevation gain for the lap in metres, or `undefined` when not recorded. */
  elevationGain: number | undefined;
  /** Intensity label as reported by the device (e.g. `'active'`, `'rest'`). */
  intensity: string;
  /** Maximum speed in m/s during the lap, or `undefined` when not recorded. */
  maxSpeed: number | undefined;
  /** `true` when the session contains rest laps and this lap is classified as active. */
  isInterval: boolean;
}

/**
 * Pairing of one active interval lap with its optional following recovery lap.
 */
interface IntervalPair {
  /** The active (high-intensity) lap of the interval. */
  active: LapAnalysis;
  /** The recovery lap immediately following the active lap, or `undefined` if none exists. */
  recovery: LapAnalysis | undefined;
  /** Heart-rate drop from active max HR to recovery min HR in bpm, or `undefined` when HR data is absent. */
  hrRecovery: number | undefined;
}

/**
 * Summary of pace and HR drift across laps, indicating whether the athlete is
 * fading, holding steady, or building through the session.
 */
interface ProgressiveOverload {
  /** Percentage change in pace from first to last (target) lap; positive = slower. `undefined` when pace data is unavailable. */
  paceDriftPercent: number | undefined;
  /** Percentage change in average HR from first to last (target) lap; positive = higher HR. `undefined` when HR data is unavailable. */
  hrDriftPercent: number | undefined;
  /** Number of laps used for the drift calculation (interval laps only, or all laps for steady-state sessions). */
  lapCount: number;
  /** Overall trend classification derived from pace drift relative to {@link DRIFT_THRESHOLD_PERCENT}. */
  trend: 'stable' | 'fading' | 'building';
}

/** Minimum absolute pace or HR drift percentage required to classify a session as `'fading'` or `'building'`. */
const DRIFT_THRESHOLD_PERCENT = 3;

/**
 * Converts raw session laps into enriched {@link LapAnalysis} objects with derived pace and intensity fields.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns An array of {@link LapAnalysis} records in the same order as the input laps.
 */
export const analyzeLaps = (laps: SessionLap[]): LapAnalysis[] => {
  if (laps.length === 0) return [];

  const hasRestLaps = laps.some((l) => l.intensity !== undefined && l.intensity !== 'active');

  return laps.map((lap) => {
    const duration = lap.totalMovingTime ?? lap.totalTimerTime;
    let paceSecPerKm: number | undefined = undefined;
    if (lap.distance !== undefined && lap.distance > 0 && duration > 0) {
      paceSecPerKm = (duration / lap.distance) * 1000;
    }

    return {
      lapIndex: lap.lapIndex,
      paceSecPerKm,
      avgHr: lap.avgHr,
      minHr: lap.minHr,
      maxHr: lap.maxHr,
      avgCadence: lap.avgCadence,
      distance: lap.distance,
      duration: lap.totalTimerTime,
      movingTime: duration,
      elevationGain: lap.totalAscent,
      maxSpeed: lap.maxSpeed,
      intensity: lap.intensity ?? 'active',
      isInterval: hasRestLaps && lap.intensity === 'active',
    };
  });
};

/**
 * Groups active interval laps with their immediately following recovery laps and computes HR recovery drops.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns An array of {@link IntervalPair} records, one per active interval lap; empty when no intervals are detected.
 */
export const detectIntervals = (laps: SessionLap[]): IntervalPair[] => {
  const analyzed = analyzeLaps(laps);
  if (!analyzed.some((l) => l.isInterval)) return [];

  const pairs: IntervalPair[] = [];

  for (let i = 0; i < analyzed.length; i++) {
    const active = analyzed[i];
    if (!active || !active.isInterval) continue;

    let nextLap: LapAnalysis | undefined = undefined;
    if (i + 1 < analyzed.length) {
      nextLap = analyzed[i + 1];
    }
    let recovery: LapAnalysis | undefined = undefined;
    if (nextLap && !nextLap.isInterval) {
      recovery = nextLap;
    }

    // HR recovery: drop from active max HR to recovery min HR
    const activeLap = laps[i];
    let recoveryLap: SessionLap | undefined = undefined;
    if (recovery) {
      recoveryLap = laps[i + 1];
    }
    let hrRecovery: number | undefined = undefined;
    if (activeLap && activeLap.maxHr !== undefined && recoveryLap?.minHr !== undefined) {
      hrRecovery = activeLap.maxHr - recoveryLap.minHr;
    }

    pairs.push({ active, recovery, hrRecovery });
  }

  return pairs;
};

/**
 * Calculates pace and HR drift from the first to the last target lap and classifies the overall trend.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns A {@link ProgressiveOverload} summary; `trend` is `'stable'` when drift is within {@link DRIFT_THRESHOLD_PERCENT}.
 */
export const detectProgressiveOverload = (laps: SessionLap[]): ProgressiveOverload => {
  const analyzed = analyzeLaps(laps);
  const intervalLaps = analyzed.filter((l) => l.isInterval);

  // If no intervals detected (steady state), use all laps
  let targetLaps = analyzed;
  if (intervalLaps.length > 0) {
    targetLaps = intervalLaps;
  }

  if (targetLaps.length < 2) {
    return {
      paceDriftPercent: undefined,
      hrDriftPercent: undefined,
      lapCount: targetLaps.length,
      trend: 'stable',
    };
  }

  const first = targetLaps[0];
  const last = targetLaps[targetLaps.length - 1];
  if (!first || !last) {
    return {
      paceDriftPercent: undefined,
      hrDriftPercent: undefined,
      lapCount: targetLaps.length,
      trend: 'stable',
    };
  }

  let paceDriftPercent: number | undefined = undefined;
  if (
    first.paceSecPerKm !== undefined &&
    last.paceSecPerKm !== undefined &&
    first.paceSecPerKm > 0
  ) {
    paceDriftPercent = ((last.paceSecPerKm - first.paceSecPerKm) / first.paceSecPerKm) * 100;
  }

  let hrDriftPercent: number | undefined = undefined;
  if (first.avgHr !== undefined && last.avgHr !== undefined && first.avgHr > 0) {
    hrDriftPercent = ((last.avgHr - first.avgHr) / first.avgHr) * 100;
  }

  let trend: ProgressiveOverload['trend'] = 'stable';
  if (paceDriftPercent !== undefined && paceDriftPercent > DRIFT_THRESHOLD_PERCENT) {
    trend = 'fading';
  } else if (paceDriftPercent !== undefined && paceDriftPercent < -DRIFT_THRESHOLD_PERCENT) {
    trend = 'building';
  }

  let roundedPaceDrift: number | undefined = undefined;
  if (paceDriftPercent !== undefined) {
    roundedPaceDrift = Math.round(paceDriftPercent * 10) / 10;
  }
  let roundedHrDrift: number | undefined = undefined;
  if (hrDriftPercent !== undefined) {
    roundedHrDrift = Math.round(hrDriftPercent * 10) / 10;
  }

  return {
    paceDriftPercent: roundedPaceDrift,
    hrDriftPercent: roundedHrDrift,
    lapCount: targetLaps.length,
    trend,
  };
};

// ---------------------------------------------------------------------------
// Coordinate → lap index lookup
// ---------------------------------------------------------------------------

/** Haversine distance in metres between two [lng, lat] points. */
const haversineDistance = (a: [number, number], b: [number, number]): number => {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Finds the nearest GPS record to a clicked coordinate.
 * Shared by both device-lap and dynamic-lap lookup.
 */
const findClosestRecord = (
  coordinate: [number, number],
  records: SessionRecord[],
): SessionRecord | undefined => {
  let minDist = Infinity;
  let closest: SessionRecord | undefined;
  for (const r of records) {
    if (r.lat === undefined || r.lng === undefined) continue;
    const dist = haversineDistance(coordinate, [r.lng, r.lat]);
    if (dist < minDist) {
      minDist = dist;
      closest = r;
    }
  }
  return closest;
};

/**
 * Finds the lap index that contains the GPS coordinate closest to the clicked point.
 * Uses device lap time boundaries.
 *
 * @param coordinate - `[longitude, latitude]` from deck.gl PickingInfo.
 * @param records - All session records (with elapsed-second timestamps).
 * @param laps - All session laps (with unix-ms start/end times).
 * @returns Zero-based lap index, or `undefined` if no match is found.
 */
export const findLapIndexAtCoordinate = (
  coordinate: [number, number],
  records: SessionRecord[],
  laps: SessionLap[],
): number | undefined => {
  if (laps.length === 0 || records.length === 0) return undefined;

  const closestRecord = findClosestRecord(coordinate, records);
  if (!closestRecord) return undefined;

  const firstLap = laps[0];
  if (!firstLap) return undefined;
  const sessionStartMs = firstLap.startTime;
  for (const lap of laps) {
    const lapStartSec = (lap.startTime - sessionStartMs) / 1000;
    const lapEndSec = (lap.endTime - sessionStartMs) / 1000;
    if (closestRecord.timestamp >= lapStartSec && closestRecord.timestamp < lapEndSec) {
      return lap.lapIndex;
    }
  }

  // Fallback: if record falls beyond last lap end (rounding), return last lap
  const lastLap = laps[laps.length - 1];
  return lastLap?.lapIndex;
};

/**
 * Finds the dynamic (distance-based) lap index for a clicked coordinate.
 *
 * @param coordinate - `[longitude, latitude]` from deck.gl PickingInfo.
 * @param records - All session records (with cumulative `distance` field).
 * @param splitDistanceMetres - The split distance used for dynamic laps.
 * @param totalLaps - Total number of dynamic laps (for clamping).
 * @returns Zero-based lap index, or `undefined` if no match is found.
 */
export const findDynamicLapIndexAtCoordinate = (
  coordinate: [number, number],
  records: SessionRecord[],
  splitDistanceMetres: number,
  totalLaps: number,
): number | undefined => {
  if (records.length === 0 || splitDistanceMetres <= 0 || totalLaps <= 0) return undefined;

  const closestRecord = findClosestRecord(coordinate, records);
  if (!closestRecord || closestRecord.distance === undefined) return undefined;

  const firstDistance = records.find((r) => r.distance !== undefined)?.distance ?? 0;
  const relativeDistance = closestRecord.distance - firstDistance;
  const lapIndex = Math.floor(relativeDistance / splitDistanceMetres);
  return Math.min(lapIndex, totalLaps - 1);
};

// ---------------------------------------------------------------------------
// Per-record lap enrichment
// ---------------------------------------------------------------------------

/**
 * Metrics derived from correlating per-second {@link SessionRecord} data with
 * a single lap's time range. Fields are `undefined` when the underlying sensor
 * data is absent in the records.
 */
export interface LapRecordEnrichment {
  lapIndex: number;
  minSpeed: number | undefined;
  avgPower: number | undefined;
  minPower: number | undefined;
  maxPower: number | undefined;
  minCadence: number | undefined;
  minHr: number | undefined;
}

/**
 * Filters records that fall within a lap's elapsed-time range.
 *
 * Lap timestamps are unix ms; record timestamps are elapsed seconds from session start.
 * `sessionStartMs` (typically `laps[0].startTime`) is used as the zero-point to
 * convert lap boundaries to elapsed seconds before filtering.
 *
 * Inclusion: `lapStartSec <= record.timestamp < lapEndSec`.
 */
export const filterRecordsByLap = (
  records: SessionRecord[],
  lap: SessionLap,
  sessionStartMs: number,
): SessionRecord[] => {
  const lapStartSec = (lap.startTime - sessionStartMs) / 1000;
  const lapEndSec = (lap.endTime - sessionStartMs) / 1000;
  return records.filter((r) => r.timestamp >= lapStartSec && r.timestamp < lapEndSec);
};

export const enrichLapFromRecords = (
  lapIndex: number,
  records: SessionRecord[],
): LapRecordEnrichment => {
  const speeds = records.map((r) => r.speed).filter((s): s is number => s !== undefined);
  const powers = records.map((r) => r.power).filter((p): p is number => p !== undefined);
  const cadences = records.map((r) => r.cadence).filter((c): c is number => c !== undefined);
  const hrs = records.map((r) => r.hr).filter((h): h is number => h !== undefined);

  speeds.sort((a, b) => a - b);
  powers.sort((a, b) => a - b);
  cadences.sort((a, b) => a - b);
  hrs.sort((a, b) => a - b);

  let minSpeed: number | undefined = undefined;
  if (speeds.length > 0) {
    minSpeed = speeds[0];
  }
  let avgPower: number | undefined = undefined;
  if (powers.length > 0) {
    avgPower = Math.round(powers.reduce((a, b) => a + b, 0) / powers.length);
  }
  let minPower: number | undefined = undefined;
  if (powers.length > 0) {
    minPower = powers[0];
  }
  let maxPower: number | undefined = undefined;
  if (powers.length > 0) {
    maxPower = powers[powers.length - 1];
  }
  let minCadence: number | undefined = undefined;
  if (cadences.length > 0) {
    minCadence = cadences[0];
  }
  let minHr: number | undefined = undefined;
  if (hrs.length > 0) {
    minHr = hrs[0];
  }

  return { lapIndex, minSpeed, avgPower, minPower, maxPower, minCadence, minHr };
};

/**
 * Batch enrichment: filters records into each lap's time range and computes
 * per-record metrics for every lap.
 */
export const enrichAllLaps = (
  laps: SessionLap[],
  records: SessionRecord[],
): LapRecordEnrichment[] => {
  const firstLap = laps[0];
  if (laps.length === 0 || records.length === 0 || !firstLap) return [];

  const sessionStartMs = firstLap.startTime;
  return laps.map((lap) => {
    const lapRecords = filterRecordsByLap(records, lap, sessionStartMs);
    return enrichLapFromRecords(lap.lapIndex, lapRecords);
  });
};
