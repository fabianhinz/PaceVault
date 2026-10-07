import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export interface LapAnalysis {
  lapIndex: number;
  paceSecPerKm: number | undefined;
  avgHr: number | undefined;
  minHr: number | undefined;
  maxHr: number | undefined;
  avgCadence: number | undefined;
  distance: number | undefined;
  timerTime: number;
  movingTime: number;
  elevationGain: number | undefined;
  intensity: string;
  maxSpeed: number | undefined;
  isInterval: boolean;
  isPartial: boolean;
}

interface IntervalPair {
  active: LapAnalysis;
  recovery: LapAnalysis | undefined;
  hrDropActiveMaxToRecoveryMin: number | undefined;
}

const MIN_RECOVERIES_FOR_INTERVALS = 2;

const isRestLap = (lap: SessionLap): boolean =>
  lap.intensity !== undefined && lap.intensity !== 'active';

const hasIntervalStructure = (laps: SessionLap[]): boolean => {
  const activeIndices: number[] = [];
  laps.forEach((lap, i) => {
    if (!isRestLap(lap)) activeIndices.push(i);
  });
  const firstActive = activeIndices[0];
  const lastActive = activeIndices[activeIndices.length - 1];
  if (firstActive === undefined || lastActive === undefined) return false;
  const recoveries = laps.slice(firstActive + 1, lastActive).filter(isRestLap);
  return recoveries.length >= MIN_RECOVERIES_FOR_INTERVALS;
};

export const analyzeLaps = (laps: SessionLap[]): LapAnalysis[] => {
  if (laps.length === 0) return [];

  const isIntervalSession = hasIntervalStructure(laps);

  return laps.map((lap) => {
    const movingTime = lap.totalMovingTime ?? lap.totalTimerTime;
    let paceSecPerKm: number | undefined = undefined;
    if (lap.distance !== undefined && lap.distance > 0 && movingTime > 0) {
      paceSecPerKm = (movingTime / lap.distance) * 1000;
    }

    return {
      lapIndex: lap.lapIndex,
      paceSecPerKm,
      avgHr: lap.avgHr,
      minHr: lap.minHr,
      maxHr: lap.maxHr,
      avgCadence: lap.avgCadence,
      distance: lap.distance,
      timerTime: lap.totalTimerTime,
      movingTime,
      elevationGain: lap.totalAscent,
      maxSpeed: lap.maxSpeed,
      intensity: lap.intensity ?? 'active',
      isPartial: false,
      isInterval: isIntervalSession && lap.intensity === 'active',
    };
  });
};

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

    const activeLap = laps[i];
    let recoveryLap: SessionLap | undefined = undefined;
    if (recovery) {
      recoveryLap = laps[i + 1];
    }
    let hrDropActiveMaxToRecoveryMin: number | undefined = undefined;
    if (activeLap && activeLap.maxHr !== undefined && recoveryLap?.minHr !== undefined) {
      hrDropActiveMaxToRecoveryMin = activeLap.maxHr - recoveryLap.minHr;
    }

    pairs.push({ active, recovery, hrDropActiveMaxToRecoveryMin });
  }

  return pairs;
};

export interface LapRecordEnrichment {
  lapIndex: number;
  minSpeed: number | undefined;
  avgPower: number | undefined;
  minPower: number | undefined;
  maxPower: number | undefined;
  minCadence: number | undefined;
  minHr: number | undefined;
}

export const filterRecordsByLap = (
  records: SessionRecord[],
  lap: SessionLap,
  sessionStartUnixMs: number,
): SessionRecord[] => {
  const lapStartUnixMs = lap.startTime;
  const lapEndUnixMs = lap.endTime;
  const lapStartSecSinceSessionStart = (lapStartUnixMs - sessionStartUnixMs) / 1000;
  const lapEndSecSinceSessionStart = (lapEndUnixMs - sessionStartUnixMs) / 1000;
  return records.filter((record) => {
    const recordSecSinceSessionStart = record.timestamp;
    return (
      recordSecSinceSessionStart >= lapStartSecSinceSessionStart &&
      recordSecSinceSessionStart < lapEndSecSinceSessionStart
    );
  });
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

export const enrichAllLaps = (
  laps: SessionLap[],
  records: SessionRecord[],
): LapRecordEnrichment[] => {
  const firstLap = laps[0];
  if (laps.length === 0 || records.length === 0 || !firstLap) return [];

  const sessionStartUnixMs = firstLap.startTime;
  return laps.map((lap) => {
    const lapRecords = filterRecordsByLap(records, lap, sessionStartUnixMs);
    return enrichLapFromRecords(lap.lapIndex, lapRecords);
  });
};
