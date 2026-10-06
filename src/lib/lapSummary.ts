import type { LapAnalysis } from './laps.ts';

export interface LapSummary {
  count: number;
  fastest: LapAnalysis | undefined;
  slowest: LapAnalysis | undefined;
  spreadSecPerKm: number | undefined;
}

const isRankable = (lap: LapAnalysis): lap is LapAnalysis & { paceSecPerKm: number } =>
  lap.intensity === 'active' && !lap.isPartial && lap.paceSecPerKm !== undefined;

export const summarizeLaps = (laps: LapAnalysis[]): LapSummary => {
  const ranked = laps.filter(isRankable);
  let fastest: (typeof ranked)[number] | undefined = undefined;
  let slowest: (typeof ranked)[number] | undefined = undefined;
  for (const lap of ranked) {
    if (!fastest || lap.paceSecPerKm < fastest.paceSecPerKm) fastest = lap;
    if (!slowest || lap.paceSecPerKm > slowest.paceSecPerKm) slowest = lap;
  }

  let spreadSecPerKm: number | undefined = undefined;
  if (fastest && slowest && ranked.length >= 2) {
    spreadSecPerKm = slowest.paceSecPerKm - fastest.paceSecPerKm;
  }

  return { count: laps.length, fastest, slowest, spreadSecPerKm };
};
