import type { SessionLap, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { MS_PER_DAY, MS_PER_SECOND } from '@pacevault/engine/time.ts';
import { createMockTrainingSession } from './sessions.ts';

type InvalidRecordKind = 'highHr' | 'highPower' | 'zeroHr';

export interface PathWaypoint {
  eastMeters: number;
  northMeters: number;
}

export interface PathJitter {
  meters: number;
  seed?: number;
}

export interface RecordGap {
  fromSec: number;
  toSec: number;
}

const LAP_DURATION_SEC = 300;
const UINT32_RANGE = 2 ** 32;
const MULBERRY32_INCREMENT = 0x6d2b79f5;
const GPS_SERIES_START_LATITUDE_DEGREES = 48.137;
const GPS_SERIES_START_LONGITUDE_DEGREES = 11.575;
const GPS_SERIES_BASE_HR_BPM = 145;
const GPS_SERIES_START_ELEVATION_METERS = 300;
const METERS_PER_DEGREE_LATITUDE = 111320;

const FIELDS_BY_INVALID_RECORD_KIND: Record<
  InvalidRecordKind,
  Pick<SessionRecord, 'hr' | 'power'>
> = {
  highHr: { hr: 240, power: 200 },
  highPower: { power: 3000, hr: 150 },
  zeroHr: { hr: 0, power: 200 },
};

const clamp = ({ value, min, max }: { value: number; min: number; max: number }): number =>
  Math.min(max, Math.max(min, value));

const randomWalk = ({
  current,
  stayProbability,
  smallStep,
  smallStepProbability,
  bigStep,
}: {
  current: number;
  stayProbability: number;
  smallStep: number;
  smallStepProbability: number;
  bigStep: number;
}): number => {
  const draw = Math.random();
  if (draw < stayProbability) return current;
  if (draw < stayProbability + smallStepProbability) {
    let smallDelta = smallStep;
    if (Math.random() < 0.5) {
      smallDelta = -smallStep;
    }
    return current + smallDelta;
  }
  let bigDelta = bigStep;
  if (Math.random() < 0.5) {
    bigDelta = -bigStep;
  }
  return current + bigDelta;
};

const terrainSegments = (
  totalRecordCount: number,
): { recordCount: number; slopeMetersPerRecord: number }[] => {
  const segments: { recordCount: number; slopeMetersPerRecord: number }[] = [];
  let remaining = totalRecordCount;
  const segmentCount = 10 + Math.floor(Math.random() * 11);

  for (let segmentIndex = 0; segmentIndex < segmentCount && remaining > 0; segmentIndex++) {
    const lastSegment = segmentIndex === segmentCount - 1;
    const averageRecordCount = Math.floor(totalRecordCount / segmentCount);
    let recordCount = Math.max(
      10,
      averageRecordCount + Math.floor((Math.random() - 0.5) * averageRecordCount),
    );
    if (lastSegment) {
      recordCount = remaining;
    }
    const segmentRecordCount = Math.min(recordCount, remaining);
    const slopeMetersPerRecord = (Math.random() - 0.5) * 0.18;
    segments.push({ recordCount: segmentRecordCount, slopeMetersPerRecord });
    remaining -= segmentRecordCount;
  }

  return segments;
};

const buildElevationArray = ({
  count,
  startElevationMeters,
}: {
  count: number;
  startElevationMeters: number;
}): number[] => {
  const segments = terrainSegments(count);
  const elevations: number[] = [];
  let elevationMeters = startElevationMeters;
  let recordIndex = 0;

  for (const segment of segments) {
    for (let j = 0; j < segment.recordCount && recordIndex < count; j++, recordIndex++) {
      elevationMeters += segment.slopeMetersPerRecord + (Math.random() - 0.5) * 0.2;
      elevations.push(Math.round(elevationMeters * 10) / 10);
    }
  }

  return elevations;
};

const buildHrArray = ({ count, baseHrBpm }: { count: number; baseHrBpm: number }): number[] => {
  const hrs: number[] = [];
  const warmUpRecordCount = Math.min(20, Math.floor(count * 0.02));
  // Target drifts upward over session (cardiac drift), matching real-world patterns
  const totalDriftBpm = 12;
  let currentHrBpm = baseHrBpm;

  for (let i = 0; i < count; i++) {
    const driftTargetBpm = baseHrBpm + totalDriftBpm * (i / count);

    if (i < warmUpRecordCount) {
      currentHrBpm = baseHrBpm - 8 + 8 * (i / warmUpRecordCount);
    } else {
      currentHrBpm = randomWalk({
        current: currentHrBpm,
        stayProbability: 0.6,
        smallStep: 1,
        smallStepProbability: 0.3,
        bigStep: 4,
      });
      currentHrBpm += (driftTargetBpm - currentHrBpm) * 0.02;
      // Per-record jitter for statistical variance (needed for TRIMP gender differentiation)
      currentHrBpm += (Math.random() - 0.5) * 2;
    }
    hrs.push(Math.round(clamp({ value: currentHrBpm, min: 40, max: 200 })));
  }

  return hrs;
};

const buildSpeedArray = ({
  count,
  baseSpeedMetersPerSec,
  elevations,
}: {
  count: number;
  baseSpeedMetersPerSec: number;
  elevations: number[];
}): number[] => {
  const speeds: number[] = [];
  let currentSpeedMetersPerSec = baseSpeedMetersPerSec * 0.5;
  const rampRecordCount = Math.min(15, Math.floor(count * 0.01));

  for (let i = 0; i < count; i++) {
    if (i < rampRecordCount) {
      currentSpeedMetersPerSec = baseSpeedMetersPerSec * (0.5 + 0.5 * (i / rampRecordCount));
    } else {
      currentSpeedMetersPerSec = randomWalk({
        current: currentSpeedMetersPerSec,
        stayProbability: 0.85,
        smallStep: 0.02,
        smallStepProbability: 0.1,
        bigStep: 0.4,
      });

      if (i > 0) {
        const elevationDeltaMeters = (elevations[i] ?? 0) - (elevations[i - 1] ?? 0);
        currentSpeedMetersPerSec -= elevationDeltaMeters * 0.15;
      }

      currentSpeedMetersPerSec += (baseSpeedMetersPerSec - currentSpeedMetersPerSec) * 0.02;
    }
    speeds.push(
      Math.round(
        clamp({
          value: currentSpeedMetersPerSec,
          min: baseSpeedMetersPerSec * 0.3,
          max: baseSpeedMetersPerSec * 1.5,
        }) * 100,
      ) / 100,
    );
  }

  return speeds;
};

const buildCadenceArray = ({
  count,
  baseCadence,
  minCadence,
  maxCadence,
}: {
  count: number;
  baseCadence: number;
  minCadence: number;
  maxCadence: number;
}): number[] => {
  const cadences: number[] = [];
  let cadence = baseCadence;

  for (let i = 0; i < count; i++) {
    cadence = randomWalk({
      current: cadence,
      stayProbability: 0.9,
      smallStep: 1,
      smallStepProbability: 0.1,
      bigStep: 0,
    });
    cadences.push(Math.round(clamp({ value: cadence, min: minCadence, max: maxCadence })));
  }

  return cadences;
};

const buildGradeArray = ({
  elevations,
  speeds,
}: {
  elevations: number[];
  speeds: number[];
}): number[] =>
  elevations.map((elevationMeters, i) => {
    if (i === 0) return 0;
    const elevationDeltaMeters = elevationMeters - (elevations[i - 1] ?? elevationMeters);
    const speedMetersPerSec = Math.max(speeds[i] ?? 0.5, 0.5);
    return Math.round((elevationDeltaMeters / speedMetersPerSec) * 100 * 10) / 10;
  });

const buildPowerArray = ({
  basePowerWatts,
  speeds,
  grades,
  baseSpeedMetersPerSec,
}: {
  basePowerWatts: number;
  speeds: number[];
  grades: number[];
  baseSpeedMetersPerSec: number;
}): number[] => {
  const powers: number[] = [];
  let currentPowerWatts = basePowerWatts * 0.5;
  const rampRecordCount = Math.min(15, Math.floor(speeds.length * 0.01));

  for (let i = 0; i < speeds.length; i++) {
    if (i < rampRecordCount) {
      currentPowerWatts = basePowerWatts * (0.5 + 0.5 * (i / rampRecordCount));
    } else {
      currentPowerWatts = randomWalk({
        current: currentPowerWatts,
        stayProbability: 0.7,
        smallStep: 5,
        smallStepProbability: 0.2,
        bigStep: 30,
      });

      currentPowerWatts += grades[i] ?? 0;

      currentPowerWatts += ((speeds[i] ?? baseSpeedMetersPerSec) - baseSpeedMetersPerSec) * 2;

      currentPowerWatts += (basePowerWatts - currentPowerWatts) * 0.02;
    }
    powers.push(
      Math.round(
        clamp({ value: currentPowerWatts, min: basePowerWatts * 0.1, max: basePowerWatts * 2 }),
      ),
    );
  }

  return powers;
};

const assembleRecords = ({
  speeds,
  hrs,
  elevations,
  cadences,
  powers,
}: {
  speeds: number[];
  hrs: number[];
  elevations: number[];
  cadences: number[];
  powers?: number[];
}): SessionRecord[] => {
  const records: SessionRecord[] = [];
  let cumulativeDistanceMeters = 0;

  for (let i = 0; i < speeds.length; i++) {
    const speedMetersPerSec = speeds[i] ?? 0;
    cumulativeDistanceMeters += speedMetersPerSec;
    const record: SessionRecord = {
      timestamp: i,
      timerTime: i,
      speed: speedMetersPerSec,
      hr: hrs[i],
      distance: cumulativeDistanceMeters,
      elevation: elevations[i],
      cadence: cadences[i],
    };
    if (powers) record.power = powers[i];
    records.push(record);
  }

  return records;
};

const pathPosition = ({
  waypoints,
  distanceMeters,
}: {
  waypoints: PathWaypoint[];
  distanceMeters: number;
}): { position: PathWaypoint; legIndex: number } => {
  let remainingMeters = distanceMeters;
  for (let legIndex = 0; legIndex < waypoints.length - 1; legIndex++) {
    const from = waypoints[legIndex];
    const to = waypoints[legIndex + 1];
    if (from === undefined || to === undefined) continue;
    const legMeters = Math.hypot(
      to.eastMeters - from.eastMeters,
      to.northMeters - from.northMeters,
    );
    if (remainingMeters <= legMeters || legIndex === waypoints.length - 2) {
      const fraction = Math.min(1, remainingMeters / Math.max(legMeters, Number.EPSILON));
      return {
        legIndex,
        position: {
          eastMeters: from.eastMeters + (to.eastMeters - from.eastMeters) * fraction,
          northMeters: from.northMeters + (to.northMeters - from.northMeters) * fraction,
        },
      };
    }
    remainingMeters -= legMeters;
  }
  return { legIndex: 0, position: waypoints[0] ?? { eastMeters: 0, northMeters: 0 } };
};

const pathLengthMeters = (waypoints: PathWaypoint[]): number =>
  waypoints.reduce((totalMeters, to, i) => {
    const from = waypoints[i - 1];
    if (from === undefined) return totalMeters;
    return (
      totalMeters + Math.hypot(to.eastMeters - from.eastMeters, to.northMeters - from.northMeters)
    );
  }, 0);

const pathRecord = ({
  position,
  timestamp,
  distanceMeters,
  gradeRatio,
}: {
  position: PathWaypoint;
  timestamp: number;
  distanceMeters: number;
  gradeRatio: number | null;
}): SessionRecord => {
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos((GPS_SERIES_START_LATITUDE_DEGREES * Math.PI) / 180);
  const record: SessionRecord = {
    timestamp,
    lat: GPS_SERIES_START_LATITUDE_DEGREES + position.northMeters / METERS_PER_DEGREE_LATITUDE,
    lng: GPS_SERIES_START_LONGITUDE_DEGREES + position.eastMeters / metersPerDegreeLongitude,
    distance: distanceMeters,
  };
  if (gradeRatio !== null) {
    record.elevation = GPS_SERIES_START_ELEVATION_METERS + distanceMeters * gradeRatio;
  }
  return record;
};

// Mulberry32: a deterministic PRNG, so a jittered track is the same in every run.
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + MULBERRY32_INCREMENT) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
};

const legDirection = ({
  waypoints,
  legIndex,
}: {
  waypoints: PathWaypoint[];
  legIndex: number;
}): PathWaypoint => {
  const from = waypoints[legIndex];
  const to = waypoints[legIndex + 1];
  if (from === undefined || to === undefined) return { eastMeters: 0, northMeters: 0 };
  const eastMeters = to.eastMeters - from.eastMeters;
  const northMeters = to.northMeters - from.northMeters;
  const lengthMeters = Math.max(Math.hypot(eastMeters, northMeters), Number.EPSILON);
  return { eastMeters: eastMeters / lengthMeters, northMeters: northMeters / lengthMeters };
};

// A positive offset lies to the right of the direction of travel.
const displacedPosition = ({
  located,
  waypoints,
  lateralOffsetMeters,
  jitterMeters,
  nextRandom,
}: {
  located: { position: PathWaypoint; legIndex: number };
  waypoints: PathWaypoint[];
  lateralOffsetMeters: number;
  jitterMeters: number;
  nextRandom: () => number;
}): PathWaypoint => {
  const direction = legDirection({ waypoints, legIndex: located.legIndex });
  const jitterEastMeters = (nextRandom() * 2 - 1) * jitterMeters;
  const jitterNorthMeters = (nextRandom() * 2 - 1) * jitterMeters;
  return {
    eastMeters:
      located.position.eastMeters + direction.northMeters * lateralOffsetMeters + jitterEastMeters,
    northMeters:
      located.position.northMeters - direction.eastMeters * lateralOffsetMeters + jitterNorthMeters,
  };
};

const insideGap = ({ timestamp, gaps }: { timestamp: number; gaps: RecordGap[] }): boolean =>
  gaps.some((gap) => timestamp >= gap.fromSec && timestamp < gap.toSec);

export const cyclingRecordSeries = ({
  count,
  basePowerWatts = 200,
  baseHrBpm = 140,
}: {
  count: number;
  basePowerWatts?: number;
  baseHrBpm?: number;
}): SessionRecord[] => {
  const baseSpeedMetersPerSec = 8.5;

  const elevations = buildElevationArray({ count, startElevationMeters: 200 });
  const hrs = buildHrArray({ count, baseHrBpm });
  const speeds = buildSpeedArray({ count, baseSpeedMetersPerSec, elevations });
  const cadences = buildCadenceArray({ count, baseCadence: 87, minCadence: 80, maxCadence: 95 });
  const grades = buildGradeArray({ elevations, speeds });
  const powers = buildPowerArray({ basePowerWatts, speeds, grades, baseSpeedMetersPerSec });

  return assembleRecords({ speeds, hrs, elevations, cadences, powers });
};

export const runningRecordSeries = ({
  count,
  baseSpeedMetersPerSec = 3.5,
  baseHrBpm = 145,
}: {
  count: number;
  baseSpeedMetersPerSec?: number;
  baseHrBpm?: number;
}): SessionRecord[] => {
  const elevations = buildElevationArray({ count, startElevationMeters: 100 });
  const hrs = buildHrArray({ count, baseHrBpm });
  const speeds = buildSpeedArray({ count, baseSpeedMetersPerSec, elevations });
  const cadences = buildCadenceArray({ count, baseCadence: 78, minCadence: 74, maxCadence: 82 });

  return assembleRecords({ speeds, hrs, elevations, cadences });
};

export const lapSeries = (count: number): SessionLap[] => {
  const laps: SessionLap[] = [];

  for (let i = 0; i < count; i++) {
    const startMs = i * LAP_DURATION_SEC * MS_PER_SECOND;
    let intensity = 'active';
    if (i % 3 === 0) {
      intensity = 'rest';
    }
    laps.push({
      lapIndex: i,
      startTime: startMs,
      endTime: startMs + LAP_DURATION_SEC * MS_PER_SECOND,
      totalTimerTime: LAP_DURATION_SEC,
      totalMovingTime: LAP_DURATION_SEC - 10,
      distance: 1000 + i * 50,
      minHr: 130 + i * 2,
      maxHr: 155 + i * 3,
      intensity,
    });
  }

  return laps;
};

export const invalidRecordSeries = (kind: InvalidRecordKind): SessionRecord[] => {
  const count = 20;
  const records: SessionRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({ timestamp: i, ...FIELDS_BY_INVALID_RECORD_KIND[kind] });
  }
  return records;
};

export const gpsRunningRecordSeries = (count: number): SessionRecord[] => {
  const records: SessionRecord[] = [];
  let cumulativeDistanceMeters = 0;

  for (let i = 0; i < count; i++) {
    const speedMetersPerSec = 3.5 + 0.5 * Math.sin(i * 0.04);
    cumulativeDistanceMeters += speedMetersPerSec;
    records.push({
      timestamp: i,
      lat: GPS_SERIES_START_LATITUDE_DEGREES + i * 0.0001,
      lng: GPS_SERIES_START_LONGITUDE_DEGREES + i * 0.00015,
      speed: speedMetersPerSec,
      hr: GPS_SERIES_BASE_HR_BPM + (i / count) * 15,
      elevation: 520 + 2 * Math.sin(i * 0.01),
      distance: cumulativeDistanceMeters,
    });
  }

  return records;
};

export const indoorRecordSeries = (count: number): SessionRecord[] => {
  const records: SessionRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      timestamp: i,
      hr: 140 + (i / count) * 20,
      speed: 3.0,
      distance: i * 3.0,
    });
  }
  return records;
};

export const sessionSeries = ({
  count,
  startDate,
  baseTss,
  tssVariation,
}: {
  count: number;
  startDate: number;
  baseTss: number;
  tssVariation: number;
}): TrainingSession[] => {
  const sessions: TrainingSession[] = [];

  for (let i = 0; i < count; i++) {
    const tss = baseTss + tssVariation * Math.sin(i * 0.8);
    const date = startDate + i * MS_PER_DAY;

    sessions.push(
      createMockTrainingSession({
        id: `session-seq-${i}`,
        date,
        tss: Math.round(tss * 10) / 10,
        duration: 3600 + i * 60,
        createdAt: date,
      }),
    );
  }

  return sessions;
};

export const gpsPathRecordSeries = ({
  path,
  speedMetersPerSec,
  legSpeedsMetersPerSec = [],
  reverse = false,
  gradeRatio = 0,
  recordIntervalSec = 1,
  lateralOffsetMeters = 0,
  jitter,
  gaps = [],
}: {
  path: PathWaypoint[];
  speedMetersPerSec: number;
  legSpeedsMetersPerSec?: number[];
  reverse?: boolean;
  gradeRatio?: number | null;
  recordIntervalSec?: number;
  lateralOffsetMeters?: number;
  jitter?: PathJitter;
  gaps?: RecordGap[];
}): SessionRecord[] => {
  let waypoints = path;
  if (reverse) waypoints = [...path].reverse();
  const totalMeters = pathLengthMeters(waypoints);
  const nextRandom = seededRandom(jitter?.seed ?? 1);
  const records: SessionRecord[] = [];
  let distanceMeters = 0;
  for (let timestamp = 0; distanceMeters <= totalMeters; timestamp += recordIntervalSec) {
    const located = pathPosition({ waypoints, distanceMeters });
    const position = displacedPosition({
      located,
      waypoints,
      lateralOffsetMeters,
      jitterMeters: jitter?.meters ?? 0,
      nextRandom,
    });
    if (!insideGap({ timestamp, gaps })) {
      records.push(pathRecord({ position, timestamp, distanceMeters, gradeRatio }));
    }
    distanceMeters +=
      (legSpeedsMetersPerSec[located.legIndex] ?? speedMetersPerSec) * recordIntervalSec;
  }
  return records;
};
