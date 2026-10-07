import type { SessionLap, SessionRecord, Sport } from '@/packages/engine/types.ts';
import {
  analyzeLaps,
  detectIntervals,
  enrichAllLaps,
  type LapAnalysis,
  type LapRecordEnrichment,
} from './laps.ts';
import { computeDynamicLaps, splitDistanceRange } from './dynamicLaps.ts';
import { deviceLapSpans, lapBands, type LapBand, type LapSpan } from './lapRanges.ts';

export type LapSource = 'off' | 'device' | 'splits';

const DEFAULT_SPLIT_DISTANCES: Record<Sport, number> = {
  running: 1000,
  cycling: 5000,
};

const defaultSplitDistance = (sport: Sport): number => DEFAULT_SPLIT_DISTANCES[sport];

export const effectiveSplitDistance = (
  splitDistance: number | null,
  sport: Sport,
  sessionMetres: number,
): number => {
  if (splitDistance !== null) return splitDistance;
  return Math.min(defaultSplitDistance(sport), splitDistanceRange(sport, sessionMetres).max);
};

export interface LapSet {
  analysis: LapAnalysis[];
  enrichments: LapRecordEnrichment[];
  spans: LapSpan[];
  bands: LapBand[];
  hrRecoveries: number[];
}

export const buildLapSet = (
  records: SessionRecord[],
  laps: SessionLap[],
  source: LapSource,
  splitDistance: number,
): LapSet | null => {
  if (source === 'off') return null;
  if (source === 'device') {
    if (laps.length === 0) return null;
    const spans = deviceLapSpans(records, laps);
    const hrRecoveries: number[] = [];
    for (const pair of detectIntervals(laps)) {
      if (pair.hrDropActiveMaxToRecoveryMin !== undefined) {
        hrRecoveries.push(pair.hrDropActiveMaxToRecoveryMin);
      }
    }
    return {
      analysis: analyzeLaps(laps),
      enrichments: enrichAllLaps(laps, records),
      spans,
      bands: lapBands(records, spans),
      hrRecoveries,
    };
  }
  const result = computeDynamicLaps(records, splitDistance);
  if (result.analysis.length === 0) return null;
  return {
    analysis: result.analysis,
    enrichments: result.enrichments,
    spans: result.spans,
    bands: lapBands(records, result.spans),
    hrRecoveries: [],
  };
};

export const stepLap = (
  bands: LapBand[],
  lapIndex: number,
  direction: -1 | 1,
): number | undefined => {
  const position = bands.findIndex((band) => band.lapIndex === lapIndex);
  if (position < 0) return undefined;
  return bands[position + direction]?.lapIndex;
};
