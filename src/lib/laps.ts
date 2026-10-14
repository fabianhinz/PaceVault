import type { SessionLap } from '@/packages/engine/types.ts';

export interface LapAnalysis {
  lapIndex: number;
  paceSecPerKm: number | undefined;
  distance: number | undefined;
  movingTime: number;
  intensity: string;
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
      distance: lap.distance,
      movingTime,
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
