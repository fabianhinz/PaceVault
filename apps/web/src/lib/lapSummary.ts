import type { LapAnalysis } from './laps.ts';
import type { LapSet } from './lapSet.ts';

export const MIN_SUMMARY_LAPS = 2;

interface LapSummary {
  count: number;
  avgSecPerKm: number | undefined;
  fastest: LapAnalysis | undefined;
  slowest: LapAnalysis | undefined;
  isIntervals: boolean;
  hrRecoveries: number[];
  avgHrRecovery: number | undefined;
}

const averagePace = (laps: LapAnalysis[]): number | undefined => {
  let seconds = 0;
  let metres = 0;
  for (const lap of laps) {
    if (lap.distance === undefined) continue;
    seconds += lap.movingTime;
    metres += lap.distance;
  }
  if (metres <= 0 || seconds <= 0) return undefined;
  return (seconds / metres) * 1000;
};

const averageOf = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const summarizeLaps = (set: LapSet): LapSummary => {
  let fastest: LapAnalysis | undefined = undefined;
  let slowest: LapAnalysis | undefined = undefined;
  for (const lap of set.analysis) {
    if (lap.paceSecPerKm === undefined) continue;
    if (fastest?.paceSecPerKm === undefined || lap.paceSecPerKm < fastest.paceSecPerKm) {
      fastest = lap;
    }
    if (slowest?.paceSecPerKm === undefined || lap.paceSecPerKm > slowest.paceSecPerKm) {
      slowest = lap;
    }
  }
  const isIntervals = set.analysis.some((lap) => lap.isInterval);
  let hrRecoveries: number[] = [];
  if (isIntervals) {
    hrRecoveries = set.hrRecoveries;
  }
  return {
    count: set.analysis.length,
    avgSecPerKm: averagePace(set.analysis),
    fastest,
    slowest,
    isIntervals,
    hrRecoveries,
    avgHrRecovery: averageOf(hrRecoveries),
  };
};
