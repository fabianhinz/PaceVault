import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';
import { analyzeLaps, enrichAllLaps, type LapAnalysis, type LapRecordEnrichment } from './laps.ts';
import { computeDynamicLaps, type SplitDistance } from './dynamicLaps.ts';
import { deviceLapSpans, lapBands, type LapBand, type LapSpan } from './lapRanges.ts';

export type LapSource = 'off' | 'device' | SplitDistance;

export const DEFAULT_SPLIT_DISTANCE: SplitDistance = 1000;

export interface LapSet {
  analysis: LapAnalysis[];
  enrichments: LapRecordEnrichment[];
  spans: LapSpan[];
  bands: LapBand[];
}

export const buildLapSet = (
  records: SessionRecord[],
  laps: SessionLap[],
  source: LapSource,
): LapSet | null => {
  if (source === 'off') return null;
  if (source === 'device') {
    if (laps.length === 0) return null;
    const spans = deviceLapSpans(records, laps);
    return {
      analysis: analyzeLaps(laps),
      enrichments: enrichAllLaps(laps, records),
      spans,
      bands: lapBands(records, spans),
    };
  }
  const result = computeDynamicLaps(records, source);
  if (result.analysis.length === 0) return null;
  return {
    analysis: result.analysis,
    enrichments: result.enrichments,
    spans: result.spans,
    bands: lapBands(records, result.spans),
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
