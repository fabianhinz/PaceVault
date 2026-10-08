// Sources: [Veness2019]
// See src/engine/SOURCES.md for full citations.

import type { SessionRecord } from './types.ts';
import { isValidCoordinate, bearingDeg, toRad, EARTH_RADIUS_M } from './gps.ts';

/**
 * A single wind observation. `direction` follows the meteorological convention: the compass bearing the
 * wind blows *from*, in degrees clockwise from true north.
 */
export interface WindSample {
  /** Observation time, unix milliseconds. */
  time: number;
  /** Direction the wind blows *from*, degrees `0–360` clockwise from true north. */
  direction: number;
}

/** Time-weighted split of a session's moving time by the wind angle relative to the direction of travel. */
export interface WindExposure {
  /** Share of moving time with the wind within 45° of head-on (0–100, integer). */
  headwindPct: number;
  /** Share of moving time with the wind roughly across the direction of travel (0–100, integer). */
  crosswindPct: number;
  /** Share of moving time with the wind within 45° of directly behind (0–100, integer). */
  tailwindPct: number;
  /** Total moving seconds classified — the denominator of the three percentages. */
  movingSeconds: number;
}

type WindClass = 'head' | 'cross' | 'tail';

export interface RelativeWind {
  angle: number;
  seconds: number;
}

interface WindSegment {
  recordIndex: number;
  seconds: number;
  angle: number;
  signedAngle: number;
  windClass: WindClass;
}

/** Segments spanning more than this many seconds are treated as a pause and skipped. */
const GAP_CAP_SEC = 30;
/** Minimum segment length in metres below which the travel bearing is too noisy to trust. */
const MIN_SEGMENT_M = 1;
/** Half-width in degrees of the head- and tail-wind sectors. */
const SECTOR_HALF_DEG = 45;

interface ValidPoint {
  lat: number;
  lng: number;
  elapsedSec: number;
}

/** Equirectangular metre distance — accurate enough over the short spans between consecutive records. */
const segmentMetres = (a: ValidPoint, b: ValidPoint): number => {
  const x = toRad(b.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
  const y = toRad(b.lat - a.lat);
  return Math.sqrt(x * x + y * y) * EARTH_RADIUS_M;
};

const signedAngleDelta = (from: number, to: number): number => ((to - from + 540) % 360) - 180;

/** Index of the wind sample nearest in time to `targetMs`; `-1` when there are none. */
const nearestWindIndex = (targetMs: number, wind: WindSample[]): number => {
  let bestIdx = -1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < wind.length; i++) {
    const sample = wind[i];
    if (sample === undefined) continue;
    const diff = Math.abs(sample.time - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
};

const windSegments = (
  records: SessionRecord[],
  wind: WindSample[],
  sessionStartMs: number,
): WindSegment[] => {
  if (wind.length === 0) return [];

  const points: Array<ValidPoint & { recordIndex: number }> = [];
  records.forEach((r, recordIndex) => {
    if (isValidCoordinate(r) && r.lat != null && r.lng != null) {
      points.push({ lat: r.lat, lng: r.lng, elapsedSec: r.timestamp, recordIndex });
    }
  });

  const segments: WindSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a === undefined || b === undefined) continue;

    const dt = b.elapsedSec - a.elapsedSec;
    if (dt <= 0 || dt > GAP_CAP_SEC) continue;
    if (segmentMetres(a, b) < MIN_SEGMENT_M) continue;

    const windIdx = nearestWindIndex(sessionStartMs + a.elapsedSec * 1000, wind);
    const sample = wind[windIdx];
    if (sample === undefined) continue;

    const signedAngle = signedAngleDelta(bearingDeg(a, b), sample.direction);
    const delta = Math.abs(signedAngle);
    let windClass: WindClass = 'cross';
    if (delta < SECTOR_HALF_DEG) {
      windClass = 'head';
    } else if (delta > 180 - SECTOR_HALF_DEG) {
      windClass = 'tail';
    }
    segments.push({
      recordIndex: b.recordIndex,
      seconds: dt,
      angle: delta,
      signedAngle,
      windClass,
    });
  }
  return segments;
};

export const windAngles = (
  records: SessionRecord[],
  wind: WindSample[],
  sessionStartMs: number,
): Array<number | undefined> => {
  const angles: Array<number | undefined> = records.map(() => undefined);
  for (const segment of windSegments(records, wind, sessionStartMs)) {
    angles[segment.recordIndex] = segment.angle;
  }
  return angles;
};

export const relativeWindAngles = (
  records: SessionRecord[],
  wind: WindSample[],
  sessionStartMs: number,
): Array<RelativeWind | undefined> => {
  const relative: Array<RelativeWind | undefined> = records.map(() => undefined);
  for (const segment of windSegments(records, wind, sessionStartMs)) {
    relative[segment.recordIndex] = { angle: segment.signedAngle, seconds: segment.seconds };
  }
  return relative;
};

/**
 * Classify each moving segment of a GPS track by the wind angle relative to the direction of travel and
 * return the time-weighted share of headwind, crosswind, and tailwind.
 *
 * Each consecutive pair of valid GPS records forms a segment; its travel bearing is compared against the
 * wind direction matched to the nearest-in-time `WindSample`. With `δ` the angle between the travel bearing
 * and the direction the wind blows *from*: `δ < 45°` → headwind, `δ > 135°` → tailwind, otherwise crosswind.
 * Segments representing a pause (`> 30 s`) or no real movement (`< 1 m`) are skipped.
 *
 * @see [Veness2019] — initial-bearing formula (via `bearingDeg`).
 * @param records - Time-series session records in chronological order.
 * @param wind - Wind observations over the session; the nearest-in-time sample is used per segment.
 * @param sessionStartMs - Session start time, unix milliseconds, used to place each record on the wall clock.
 * @returns A `WindExposure` whose three percentages sum to 100, or `null` when there is too little data.
 */
export const computeWindExposure = (
  records: SessionRecord[],
  wind: WindSample[],
  sessionStartMs: number,
): WindExposure | null => {
  let headSec = 0;
  let crossSec = 0;
  let tailSec = 0;

  for (const segment of windSegments(records, wind, sessionStartMs)) {
    if (segment.windClass === 'head') {
      headSec += segment.seconds;
    } else if (segment.windClass === 'tail') {
      tailSec += segment.seconds;
    } else {
      crossSec += segment.seconds;
    }
  }

  const total = headSec + crossSec + tailSec;
  if (total <= 0) return null;

  const result: WindExposure = {
    headwindPct: Math.round((headSec / total) * 100),
    crosswindPct: Math.round((crossSec / total) * 100),
    tailwindPct: Math.round((tailSec / total) * 100),
    movingSeconds: total,
  };

  // Absorb the rounding remainder into whichever bucket holds the most time, so the three always sum to 100.
  const drift = 100 - (result.headwindPct + result.crosswindPct + result.tailwindPct);
  if (drift !== 0) {
    if (headSec >= crossSec && headSec >= tailSec) {
      result.headwindPct += drift;
    } else if (tailSec >= crossSec) {
      result.tailwindPct += drift;
    } else {
      result.crosswindPct += drift;
    }
  }

  return result;
};
