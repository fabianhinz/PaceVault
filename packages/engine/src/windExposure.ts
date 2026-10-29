// Sources: [Veness2019]
// See packages/engine/SOURCES.md for full citations.

import type { SessionRecord } from './types.ts';
import {
  isValidCoordinate,
  initialBearingDegrees,
  degreesToRadians,
  EARTH_RADIUS_METERS,
} from './geodesy.ts';
import { MS_PER_SECOND } from './time.ts';

/**
 * A single wind observation. `directionDegrees` follows the meteorological convention: the compass bearing the
 * wind blows *from*, in degrees clockwise from true north.
 */
export interface WindSample {
  timeMs: number;
  directionDegrees: number;
}

export interface WindExposure {
  headwindPct: number;
  crosswindPct: number;
  tailwindPct: number;
  movingSec: number;
}

type WindClass = 'head' | 'cross' | 'tail';

export interface RelativeWind {
  angle: number;
  durationSec: number;
}

interface WindSegment {
  recordIndex: number;
  durationSec: number;
  angle: number;
  signedAngle: number;
  windClass: WindClass;
}

interface ValidPoint {
  lat: number;
  lng: number;
  elapsedSec: number;
}

const GAP_CAP_SEC = 30;
const MIN_SEGMENT_METERS = 1;
const SECTOR_HALF_DEGREES = 45;

/** Equirectangular metre distance — accurate enough over the short spans between consecutive records. */
const segmentLengthMeters = ({ from, to }: { from: ValidPoint; to: ValidPoint }): number => {
  const eastRadians =
    degreesToRadians(to.lng - from.lng) * Math.cos(degreesToRadians((from.lat + to.lat) / 2));
  const northRadians = degreesToRadians(to.lat - from.lat);
  return Math.sqrt(eastRadians * eastRadians + northRadians * northRadians) * EARTH_RADIUS_METERS;
};

const signedAngleDelta = ({ from, to }: { from: number; to: number }): number =>
  ((to - from + 540) % 360) - 180;

const nearestWindIndex = ({ targetMs, wind }: { targetMs: number; wind: WindSample[] }): number => {
  let bestIndex = -1;
  let bestDiffMs = Number.POSITIVE_INFINITY;
  for (let i = 0; i < wind.length; i++) {
    const sample = wind[i];
    if (sample === undefined) continue;
    const diffMs = Math.abs(sample.timeMs - targetMs);
    if (diffMs < bestDiffMs) {
      bestDiffMs = diffMs;
      bestIndex = i;
    }
  }
  return bestIndex;
};

const windSegments = ({
  records,
  wind,
  sessionStartMs,
}: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}): WindSegment[] => {
  if (wind.length === 0) return [];

  const points: Array<ValidPoint & { recordIndex: number }> = [];
  records.forEach((record, recordIndex) => {
    if (isValidCoordinate(record)) {
      points.push({ lat: record.lat, lng: record.lng, elapsedSec: record.timestamp, recordIndex });
    }
  });

  const segments: WindSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === undefined || end === undefined) continue;

    const elapsedSec = end.elapsedSec - start.elapsedSec;
    if (elapsedSec <= 0 || elapsedSec > GAP_CAP_SEC) continue;
    if (segmentLengthMeters({ from: start, to: end }) < MIN_SEGMENT_METERS) continue;

    const windIndex = nearestWindIndex({
      targetMs: sessionStartMs + start.elapsedSec * MS_PER_SECOND,
      wind,
    });
    const sample = wind[windIndex];
    if (sample === undefined) continue;

    const signedAngle = signedAngleDelta({
      from: initialBearingDegrees({ from: start, to: end }),
      to: sample.directionDegrees,
    });
    const delta = Math.abs(signedAngle);
    let windClass: WindClass = 'cross';
    if (delta < SECTOR_HALF_DEGREES) {
      windClass = 'head';
    } else if (delta > 180 - SECTOR_HALF_DEGREES) {
      windClass = 'tail';
    }
    segments.push({
      recordIndex: end.recordIndex,
      durationSec: elapsedSec,
      angle: delta,
      signedAngle,
      windClass,
    });
  }
  return segments;
};

export const windAngles = ({
  records,
  wind,
  sessionStartMs,
}: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}): Array<number | undefined> => {
  const angles: Array<number | undefined> = records.map(() => undefined);
  for (const segment of windSegments({ records, wind, sessionStartMs })) {
    angles[segment.recordIndex] = segment.angle;
  }
  return angles;
};

export const relativeWindAngles = ({
  records,
  wind,
  sessionStartMs,
}: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}): Array<RelativeWind | undefined> => {
  const relative: Array<RelativeWind | undefined> = records.map(() => undefined);
  for (const segment of windSegments({ records, wind, sessionStartMs })) {
    relative[segment.recordIndex] = {
      angle: segment.signedAngle,
      durationSec: segment.durationSec,
    };
  }
  return relative;
};

/** @see [Veness2019] */
export const windExposureFromRecords = ({
  records,
  wind,
  sessionStartMs,
}: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}): WindExposure | null => {
  const secondsByWindClass: Record<WindClass, number> = { head: 0, cross: 0, tail: 0 };
  for (const segment of windSegments({ records, wind, sessionStartMs })) {
    secondsByWindClass[segment.windClass] += segment.durationSec;
  }
  const headSec = secondsByWindClass.head;
  const crossSec = secondsByWindClass.cross;
  const tailSec = secondsByWindClass.tail;

  const total = headSec + crossSec + tailSec;
  if (total <= 0) return null;

  const exposure: WindExposure = {
    headwindPct: Math.round((headSec / total) * 100),
    crosswindPct: Math.round((crossSec / total) * 100),
    tailwindPct: Math.round((tailSec / total) * 100),
    movingSec: total,
  };

  // Absorb the rounding remainder into whichever bucket holds the most time, so the three always sum to 100.
  const drift = 100 - (exposure.headwindPct + exposure.crosswindPct + exposure.tailwindPct);
  if (drift !== 0) {
    if (headSec >= crossSec && headSec >= tailSec) {
      exposure.headwindPct += drift;
    } else if (tailSec >= crossSec) {
      exposure.tailwindPct += drift;
    } else {
      exposure.crosswindPct += drift;
    }
  }

  return exposure;
};
