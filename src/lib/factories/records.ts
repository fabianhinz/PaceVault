import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';

// --- Random-walk helpers ---

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const randomWalk = (
  current: number,
  stayProb: number,
  smallStep: number,
  smallProb: number,
  bigStep: number,
): number => {
  const r = Math.random();
  if (r < stayProb) return current;
  if (r < stayProb + smallProb) {
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

// Generate terrain segments: each segment has a length (in records) and a slope (m/record)
const generateTerrainSegments = (totalRecords: number): { length: number; slope: number }[] => {
  const segments: { length: number; slope: number }[] = [];
  let remaining = totalRecords;
  const segmentCount = 10 + Math.floor(Math.random() * 11); // 10-20 segments

  for (let s = 0; s < segmentCount && remaining > 0; s++) {
    const isLast = s === segmentCount - 1;
    const avgLen = Math.floor(totalRecords / segmentCount);
    let length = Math.max(10, avgLen + Math.floor((Math.random() - 0.5) * avgLen));
    if (isLast) {
      length = remaining;
    }
    const actualLen = Math.min(length, remaining);
    // slope in meters per record, range roughly -3% to +3% grade at ~3m/s -> -0.09 to +0.09 m/s
    const slope = (Math.random() - 0.5) * 0.18;
    segments.push({ length: actualLen, slope });
    remaining -= actualLen;
  }

  if (remaining > 0) {
    segments.push({ length: remaining, slope: 0 });
  }

  return segments;
};

// Build elevation array from terrain segments + GPS jitter
const buildElevationArray = (count: number, startElevation: number): number[] => {
  const segments = generateTerrainSegments(count);
  const elevations: number[] = [];
  let elev = startElevation;
  let idx = 0;

  for (const seg of segments) {
    for (let j = 0; j < seg.length && idx < count; j++, idx++) {
      elev += seg.slope + (Math.random() - 0.5) * 0.2; // ±0.1m jitter
      elevations.push(Math.round(elev * 10) / 10);
    }
  }

  // Fill any remainder
  while (elevations.length < count) {
    elevations.push(elevations[elevations.length - 1] ?? startElevation);
  }

  return elevations;
};

// HR random walk: slow drift with warm-up phase
const buildHrArray = (count: number, baseHr: number): number[] => {
  const hrs: number[] = [];
  const warmUpDuration = Math.min(20, Math.floor(count * 0.02));
  // Target drifts upward over session (cardiac drift), matching real-world patterns
  const totalDrift = 12;
  let currentHr = baseHr;

  for (let i = 0; i < count; i++) {
    // Drift target: baseHr at start → baseHr + totalDrift at end
    const driftTarget = baseHr + totalDrift * (i / count);

    if (i < warmUpDuration) {
      // Warm-up: ramp from slightly below base to base
      currentHr = baseHr - 8 + 8 * (i / warmUpDuration);
    } else {
      // Steady state random walk
      currentHr = randomWalk(currentHr, 0.6, 1, 0.3, 4);
      // Weak mean reversion toward drifting target
      currentHr += (driftTarget - currentHr) * 0.02;
      // Per-record jitter for statistical variance (needed for TRIMP gender differentiation)
      currentHr += (Math.random() - 0.5) * 2;
    }
    hrs.push(Math.round(clamp(currentHr, 40, 200)));
  }

  return hrs;
};

// Speed random walk with terrain influence
const buildSpeedArray = (count: number, baseSpeed: number, elevations: number[]): number[] => {
  const speeds: number[] = [];
  let currentSpeed = baseSpeed * 0.5;
  const rampDuration = Math.min(15, Math.floor(count * 0.01));
  const hasTerrain = elevations.length > 0;

  for (let i = 0; i < count; i++) {
    if (i < rampDuration) {
      // Quick ramp from half to full base speed
      currentSpeed = baseSpeed * (0.5 + 0.5 * (i / rampDuration));
    } else {
      currentSpeed = randomWalk(currentSpeed, 0.85, 0.02, 0.1, 0.4);

      // Terrain influence: uphill = slower, downhill = faster
      if (hasTerrain && i > 0) {
        const elevDiff = (elevations[i] ?? 0) - (elevations[i - 1] ?? 0);
        currentSpeed -= elevDiff * 0.15;
      }

      // Mean reversion toward base speed
      currentSpeed += (baseSpeed - currentSpeed) * 0.02;
    }
    speeds.push(Math.round(clamp(currentSpeed, baseSpeed * 0.3, baseSpeed * 1.5) * 100) / 100);
  }

  return speeds;
};

// Cadence random walk: very stable
const buildCadenceArray = (count: number, base: number, min: number, max: number): number[] => {
  const cadences: number[] = [];
  let current = base;

  for (let i = 0; i < count; i++) {
    current = randomWalk(current, 0.9, 1, 0.1, 0);
    cadences.push(Math.round(clamp(current, min, max)));
  }

  return cadences;
};

// Grade: derived from elevation and speed
const buildGradeArray = (elevations: number[], speeds: number[]): number[] =>
  elevations.map((elev, i) => {
    if (i === 0) return 0;
    const elevDiff = elev - (elevations[i - 1] ?? elev);
    const distance = Math.max(speeds[i] ?? 0.5, 0.5); // meters traveled in 1s
    return Math.round((elevDiff / distance) * 100 * 10) / 10;
  });

// Power random walk for cycling, correlated with speed/grade
const buildPowerArray = (
  count: number,
  basePower: number,
  speeds: number[],
  grades: number[],
  baseSpeed: number,
): number[] => {
  const powers: number[] = [];
  let currentPower = basePower * 0.5;
  const rampDuration = Math.min(15, Math.floor(count * 0.01));

  for (let i = 0; i < count; i++) {
    if (i < rampDuration) {
      currentPower = basePower * (0.5 + 0.5 * (i / rampDuration));
    } else {
      currentPower = randomWalk(currentPower, 0.7, 5, 0.2, 30);

      // Grade influence: uphill = more power, downhill = slightly less
      currentPower += grades[i] ?? 0;

      // Speed influence
      currentPower += ((speeds[i] ?? baseSpeed) - baseSpeed) * 2;

      // Mean reversion
      currentPower += (basePower - currentPower) * 0.02;
    }
    powers.push(Math.round(clamp(currentPower, basePower * 0.1, basePower * 2)));
  }

  return powers;
};

// Assemble per-index arrays into SessionRecord objects
const assembleRecords = (
  sessionId: string,
  speeds: number[],
  hrs: number[],
  channels?: {
    elevations?: number[];
    cadences?: number[];
    grades?: number[];
    powers?: number[];
  },
): SessionRecord[] => {
  const records: SessionRecord[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < speeds.length; i++) {
    const speed = speeds[i] ?? 0;
    cumulativeDistance += speed;
    const record: SessionRecord = {
      sessionId,
      timestamp: i,
      timerTime: i,
      speed,
      hr: hrs[i],
      distance: cumulativeDistance,
    };
    if (channels?.elevations) record.elevation = channels.elevations[i];
    if (channels?.cadences) record.cadence = channels.cadences[i];
    if (channels?.grades) record.grade = channels.grades[i];
    if (channels?.powers) record.power = channels.powers[i];
    records.push(record);
  }

  return records;
};

export const makeCyclingRecords = (
  sessionId: string,
  count: number,
  options?: { basePower?: number; baseHr?: number },
): SessionRecord[] => {
  const basePower = options?.basePower ?? 200;
  const baseHr = options?.baseHr ?? 140;
  const baseSpeed = 8.5;

  const elevations = buildElevationArray(count, 200);
  const hrs = buildHrArray(count, baseHr);
  const speeds = buildSpeedArray(count, baseSpeed, elevations);
  const cadences = buildCadenceArray(count, 87, 80, 95);
  const grades = buildGradeArray(elevations, speeds);
  const powers = buildPowerArray(count, basePower, speeds, grades, baseSpeed);

  return assembleRecords(sessionId, speeds, hrs, { elevations, cadences, grades, powers });
};

export const makeRunningRecords = (
  sessionId: string,
  count: number,
  options?: { baseSpeed?: number; baseHr?: number },
): SessionRecord[] => {
  const baseSpeed = options?.baseSpeed ?? 3.5;
  const baseHr = options?.baseHr ?? 145;

  const elevations = buildElevationArray(count, 100);
  const hrs = buildHrArray(count, baseHr);
  const speeds = buildSpeedArray(count, baseSpeed, elevations);
  const cadences = buildCadenceArray(count, 78, 74, 82);
  const grades = buildGradeArray(elevations, speeds);

  return assembleRecords(sessionId, speeds, hrs, { elevations, cadences, grades });
};

export const makeLaps = (sessionId: string, count: number): SessionLap[] => {
  const laps: SessionLap[] = [];
  const lapDuration = 300;

  for (let i = 0; i < count; i++) {
    const startMs = i * lapDuration * 1000;
    let intensity = 'active';
    if (i % 3 === 0) {
      intensity = 'rest';
    }
    laps.push({
      sessionId,
      lapIndex: i,
      startTime: startMs,
      endTime: startMs + lapDuration * 1000,
      totalElapsedTime: lapDuration,
      totalTimerTime: lapDuration,
      totalMovingTime: lapDuration - 10,
      distance: 1000 + i * 50,
      avgSpeed: 3.2 + i * 0.1,
      maxSpeed: 4.0 + i * 0.1,
      totalAscent: 5 + i,
      avgHr: 140 + i * 3,
      minHr: 130 + i * 2,
      maxHr: 155 + i * 3,
      avgCadence: 82 + i,
      intensity,
      repetitionNum: i + 1,
    });
  }

  return laps;
};

export const makeLapsFromRecords = (
  sessionId: string,
  records: SessionRecord[],
  lapDurationSec: number = 300,
): SessionLap[] => {
  if (records.length < 2) return [];

  const laps: SessionLap[] = [];
  let lapStart = 0;

  const closeLap = (startIdx: number, endIdx: number, lapIndex: number) => {
    const slice = records.slice(startIdx, endIdx + 1);
    if (slice.length < 2) return;

    const first = slice[0];
    const last = slice[slice.length - 1];
    if (!first || !last) return;
    const duration = last.timestamp - first.timestamp;
    const distance = (last.distance ?? 0) - (first.distance ?? 0);

    const hrs: number[] = [];
    const speeds: number[] = [];
    const cadences: number[] = [];
    for (const r of slice) {
      if (r.hr !== undefined) hrs.push(r.hr);
      if (r.speed !== undefined) speeds.push(r.speed);
      if (r.cadence !== undefined) cadences.push(r.cadence);
    }

    let elevationGain = 0;
    for (let i = 1; i < slice.length; i++) {
      const prevRecord = slice[i - 1];
      const currRecord = slice[i];
      if (!prevRecord || !currRecord) continue;
      const prev = prevRecord.elevation;
      const curr = currRecord.elevation;
      if (prev !== undefined && curr !== undefined && curr > prev) {
        elevationGain += curr - prev;
      }
    }

    let avgHr: number | undefined = undefined;
    if (hrs.length > 0) {
      avgHr = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
    }
    let avgSpeed = 0;
    if (speeds.length > 0) {
      avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    }

    let maxSpeed: number | undefined = undefined;
    if (speeds.length > 0) {
      maxSpeed = Math.max(...speeds);
    }
    let totalAscent: number | undefined = undefined;
    if (elevationGain > 0) {
      totalAscent = Math.round(elevationGain);
    }
    let minHr: number | undefined = undefined;
    if (hrs.length > 0) {
      minHr = Math.round(Math.min(...hrs));
    }
    let maxHr: number | undefined = undefined;
    if (hrs.length > 0) {
      maxHr = Math.round(Math.max(...hrs));
    }
    let avgCadence: number | undefined = undefined;
    if (cadences.length > 0) {
      avgCadence = Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length);
    }

    laps.push({
      sessionId,
      lapIndex,
      startTime: first.timestamp * 1000,
      endTime: last.timestamp * 1000,
      totalElapsedTime: duration,
      totalTimerTime: duration,
      distance,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      maxSpeed,
      totalAscent,
      avgHr,
      minHr,
      maxHr,
      avgCadence,
      intensity: 'active',
      repetitionNum: lapIndex + 1,
    });
  };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const lapStartRec = records[lapStart];
    if (!rec || !lapStartRec) continue;
    if (rec.timestamp - lapStartRec.timestamp >= lapDurationSec) {
      closeLap(lapStart, i, laps.length);
      lapStart = i;
    }
  }

  if (lapStart < records.length - 1) {
    closeLap(lapStart, records.length - 1, laps.length);
  }

  return laps;
};
