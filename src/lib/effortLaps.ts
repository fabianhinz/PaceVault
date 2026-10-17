import {
  detectEfforts,
  type EffortBlock,
  type EffortKind,
  type EffortLimiter,
  type EffortSignal,
} from '@/packages/engine/effortDetection.ts';
import type { SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { ResolvedThresholds } from './thresholdsAt.ts';
import type { LapAnalysis } from './laps.ts';
import { lapBands, type LapSpan } from './lapRanges.ts';
import type { LapSet } from './lapSet.ts';

const PATTERN_TOLERANCE = 0.1;

const KIND_INTENSITY: Record<EffortKind, string> = {
  work: 'active',
  rest: 'rest',
  steady: 'steady',
  warmup: 'warmup',
  cooldown: 'cooldown',
};

interface EffortLapResult {
  set: LapSet | null;
  limitedBy: EffortLimiter | undefined;
}

/**
 * Detection signal averaged over the work blocks, weighted by moving time: power W, pace
 * grade-adjusted sec/km, HR bpm. `undefined` when no work block has samples or the average speed is 0.
 */
export const effortWorkAverage = (
  blocks: EffortBlock[],
  signal: EffortSignal,
): number | undefined => {
  let weighted = 0;
  let weight = 0;
  for (const block of blocks) {
    if (block.kind !== 'work' || block.signalMean === undefined) continue;
    weighted += block.signalMean * block.movingTime;
    weight += block.movingTime;
  }
  if (weight === 0) return undefined;
  const mean = weighted / weight;
  if (signal !== 'pace') return mean;
  if (mean <= 0) return undefined;
  return 1000 / mean;
};

const recordDistance = (
  records: SessionRecord[],
  startIndex: number,
  endIndex: number,
): number | undefined => {
  const start = records[startIndex]?.distance;
  const end = records[endIndex]?.distance;
  if (start === undefined || end === undefined) return undefined;
  return end - start;
};

export const buildEffortLapSet = (
  records: SessionRecord[],
  sport: Sport,
  thresholds: ResolvedThresholds | undefined,
): EffortLapResult => {
  if (thresholds === undefined) return { set: null, limitedBy: undefined };
  const detection = detectEfforts(records, sport, thresholds);
  if (detection.blocks.length === 0 || detection.signal === null) {
    return { set: null, limitedBy: detection.limitedBy };
  }
  const spans: LapSpan[] = [];
  const analysis: LapAnalysis[] = [];
  detection.blocks.forEach((block, lapIndex) => {
    spans.push({ lapIndex, startRecord: block.startIndex, endRecord: block.endIndex });
    const distance = recordDistance(records, block.startIndex, block.endIndex);
    let paceSecPerKm: number | undefined = undefined;
    if (distance !== undefined && distance > 0 && block.movingTime > 0) {
      paceSecPerKm = (block.movingTime / distance) * 1000;
    }
    analysis.push({
      lapIndex,
      paceSecPerKm,
      distance,
      movingTime: block.movingTime,
      intensity: KIND_INTENSITY[block.kind],
      isInterval: block.kind === 'work',
      isPartial: false,
    });
  });
  return {
    set: {
      analysis,
      spans,
      bands: lapBands(records, spans),
      hrRecoveries: [],
      efforts: {
        signal: detection.signal,
        limitedBy: detection.limitedBy,
        workAverage: effortWorkAverage(detection.blocks, detection.signal),
      },
    },
    limitedBy: detection.limitedBy,
  };
};

export const effortWorkSet = (set: LapSet): LapSet => ({
  ...set,
  analysis: set.analysis.filter((lap) => lap.isInterval),
});

export const effortWorkCount = (set: LapSet): number => effortWorkSet(set).analysis.length;

export const effortPattern = (set: LapSet): { count: number; movingTime: number } | undefined => {
  const durations = effortWorkSet(set).analysis.map((lap) => lap.movingTime);
  if (durations.length < 2) return undefined;
  const mean = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const matches = durations.every((value) => Math.abs(value - mean) <= PATTERN_TOLERANCE * mean);
  if (!matches) return undefined;
  return { count: durations.length, movingTime: mean };
};
