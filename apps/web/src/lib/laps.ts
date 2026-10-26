import {
  detectEfforts,
  type EffortBlock,
  type EffortKind,
  type EffortLimiter,
  type EffortSignal,
} from '@pacevault/engine/effortDetection.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';
import type { SessionLap, SessionRecord, Sport } from '@pacevault/engine/types.ts';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { ResolvedThresholds } from '@/lib/thresholdsAt.ts';

export interface LapAnalysis {
  lapIndex: number;
  paceSecPerKm: number | undefined;
  distance: number | undefined;
  movingTime: number;
  intensity: string;
  interval: boolean;
  partial: boolean;
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

  const intervalSession = hasIntervalStructure(laps);

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
      partial: false,
      interval: intervalSession && lap.intensity === 'active',
    };
  });
};

export const detectIntervals = (laps: SessionLap[]): IntervalPair[] => {
  const analyzed = analyzeLaps(laps);
  if (!analyzed.some((l) => l.interval)) return [];

  const pairs: IntervalPair[] = [];

  for (let i = 0; i < analyzed.length; i++) {
    const active = analyzed[i];
    if (!active || !active.interval) continue;

    let nextLap: LapAnalysis | undefined = undefined;
    if (i + 1 < analyzed.length) {
      nextLap = analyzed[i + 1];
    }
    let recovery: LapAnalysis | undefined = undefined;
    if (nextLap && !nextLap.interval) {
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

export interface LapSpan {
  lapIndex: number;
  startRecord: number;
  endRecord: number;
}

export interface LapBand {
  lapIndex: number;
  from: number;
  to: number;
}

const firstRecordAtOrAfter = ({
  records,
  seconds,
}: {
  records: SessionRecord[];
  seconds: number;
}): number => records.findIndex((record) => record.timestamp >= seconds);

export const deviceLapSpans = ({
  records,
  laps,
}: {
  records: SessionRecord[];
  laps: SessionLap[];
}): LapSpan[] => {
  const firstLap = laps[0];
  const lastRecord = records.length - 1;
  if (!firstLap || lastRecord < 0) return [];

  const sessionStartMs = firstLap.startTime;
  const spans: LapSpan[] = [];
  for (const lap of laps) {
    const startSec = (lap.startTime - sessionStartMs) / MS_PER_SECOND;
    const endSec = (lap.endTime - sessionStartMs) / MS_PER_SECOND;
    const startRecord = firstRecordAtOrAfter({ records, seconds: startSec });
    if (startRecord < 0) continue;
    const start = records[startRecord];
    if (!start || start.timestamp >= endSec) continue;
    let endRecord = firstRecordAtOrAfter({ records, seconds: endSec });
    if (endRecord < 0) {
      endRecord = lastRecord;
    }
    spans.push({ lapIndex: lap.lapIndex, startRecord, endRecord });
  }
  return spans;
};

export const lapBands = ({
  records,
  spans,
}: {
  records: SessionRecord[];
  spans: LapSpan[];
}): LapBand[] => {
  const moving = movingSeconds(records);
  const bands: LapBand[] = [];
  for (const span of spans) {
    const from = moving[span.startRecord];
    const to = moving[span.endRecord];
    if (from === undefined || to === undefined) continue;
    bands.push({ lapIndex: span.lapIndex, from: from / 60, to: to / 60 });
  }
  return bands;
};

const indexInRanges = <T extends { lapIndex: number }>({
  ranges,
  value,
  start,
  end,
}: {
  ranges: T[];
  value: number;
  start: (range: T) => number;
  end: (range: T) => number;
}): number | undefined => {
  const last = ranges[ranges.length - 1];
  for (const range of ranges) {
    if (value < start(range)) continue;
    if (value < end(range)) return range.lapIndex;
    if (range === last && value === end(range)) return range.lapIndex;
  }
  return undefined;
};

export const lapIndexAtRecord = ({
  spans,
  recordIndex,
}: {
  spans: LapSpan[];
  recordIndex: number;
}): number | undefined =>
  indexInRanges({
    ranges: spans,
    value: recordIndex,
    start: (span) => span.startRecord,
    end: (span) => span.endRecord,
  });

export const lapIndexAtTime = ({
  bands,
  minutes,
}: {
  bands: LapBand[];
  minutes: number;
}): number | undefined =>
  indexInRanges({
    ranges: bands,
    value: minutes,
    start: (band) => band.from,
    end: (band) => band.to,
  });

export const bandsOnRows = ({ bands, xs }: { bands: LapBand[]; xs: number[] }): LapBand[] => {
  const first = xs[0];
  const last = xs[xs.length - 1];
  if (first === undefined || last === undefined) return [];
  const snapped: LapBand[] = [];
  for (const band of bands) {
    if (band.to < first || band.from > last) continue;
    const from = xs.find((x) => x >= band.from);
    const to = xs.find((x) => x >= band.to) ?? last;
    if (from === undefined) continue;
    snapped.push({ lapIndex: band.lapIndex, from, to });
  }
  return snapped;
};

interface SplitDistanceRange {
  min: number;
  max: number;
  step: number;
}

const SPLIT_RANGES: Record<Sport, SplitDistanceRange> = {
  running: { min: 500, max: 10_000, step: 500 },
  cycling: { min: 1000, max: 50_000, step: 1000 },
};

export const recordedDistance = (records: SessionRecord[]): number => {
  const first = records.find((record) => record.distance !== undefined)?.distance;
  const last = records.findLast((record) => record.distance !== undefined)?.distance;
  if (first === undefined || last === undefined) return 0;
  return Math.max(0, last - first);
};

export const splitDistanceRange = ({
  sport,
  sessionMetres,
}: {
  sport: Sport;
  sessionMetres: number;
}): SplitDistanceRange => {
  const range = SPLIT_RANGES[sport];
  const cap = Math.floor(sessionMetres / range.step) * range.step;
  const max = Math.max(range.min, Math.min(range.max, cap));
  return { min: range.min, max, step: range.step };
};

interface DynamicLapResult {
  analysis: LapAnalysis[];
  spans: LapSpan[];
}

const distanceIndices = (records: SessionRecord[]): number[] => {
  const withDistance: number[] = [];
  records.forEach((record, i) => {
    if (record.distance !== undefined) withDistance.push(i);
  });
  return withDistance;
};

interface SliceEnds {
  startRecord: number;
  endRecord: number;
  firstDistance: number;
  lastDistance: number;
  movingStart: number;
  movingEnd: number;
}

const sliceEnds = ({
  records,
  moving,
  indices,
}: {
  records: SessionRecord[];
  moving: number[];
  indices: number[];
}): SliceEnds | undefined => {
  const slice = indices.map((i) => records[i]).filter((r): r is SessionRecord => r !== undefined);
  const startRecord = indices[0];
  const endRecord = indices[indices.length - 1];
  if (slice.length < 2 || startRecord === undefined || endRecord === undefined) return undefined;

  const first = slice[0];
  const last = slice[slice.length - 1];
  const movingStart = moving[startRecord];
  const movingEnd = moving[endRecord];
  if (!first || !last || movingStart === undefined || movingEnd === undefined) return undefined;
  if (first.distance === undefined || last.distance === undefined) return undefined;
  return {
    startRecord,
    endRecord,
    firstDistance: first.distance,
    lastDistance: last.distance,
    movingStart,
    movingEnd,
  };
};

const lapFromSlice = ({
  records,
  moving,
  indices,
  lapIndex,
  partial,
}: {
  records: SessionRecord[];
  moving: number[];
  indices: number[];
  lapIndex: number;
  partial: boolean;
}): { analysis: LapAnalysis; span: LapSpan } | undefined => {
  const ends = sliceEnds({ records, moving, indices });
  if (!ends) return undefined;

  const distance = ends.lastDistance - ends.firstDistance;
  const movingTime = ends.movingEnd - ends.movingStart;

  let paceSecPerKm: number | undefined = undefined;
  if (distance > 0 && movingTime > 0) {
    paceSecPerKm = (movingTime / distance) * 1000;
  }

  return {
    analysis: {
      lapIndex,
      paceSecPerKm,
      distance,
      movingTime,
      intensity: 'active',
      interval: false,
      partial,
    },
    span: { lapIndex, startRecord: ends.startRecord, endRecord: ends.endRecord },
  };
};

interface SplitLapRange {
  startPos: number;
  endPos: number;
  partial: boolean;
}

const splitLapRanges = ({
  records,
  withDistance,
  firstDistance,
  splitDistanceMetres,
}: {
  records: SessionRecord[];
  withDistance: number[];
  firstDistance: number;
  splitDistanceMetres: number;
}): SplitLapRange[] => {
  const ranges: SplitLapRange[] = [];
  let lapStart = 0;
  let nextBoundary = firstDistance + splitDistanceMetres;
  withDistance.forEach((recordIndex, pos) => {
    const d = records[recordIndex]?.distance;
    if (d === undefined || d < nextBoundary) return;
    ranges.push({ startPos: lapStart, endPos: pos, partial: false });
    lapStart = pos;
    const crossed = Math.floor((d - firstDistance) / splitDistanceMetres);
    nextBoundary = firstDistance + (crossed + 1) * splitDistanceMetres;
  });

  if (lapStart < withDistance.length - 1) {
    ranges.push({ startPos: lapStart, endPos: withDistance.length - 1, partial: true });
  }
  return ranges;
};

export const computeDynamicLaps = ({
  records,
  splitDistanceMetres,
}: {
  records: SessionRecord[];
  splitDistanceMetres: number;
}): DynamicLapResult => {
  const withDistance = distanceIndices(records);
  const empty: DynamicLapResult = { analysis: [], spans: [] };
  const firstIndex = withDistance[0];
  if (withDistance.length < 2 || firstIndex === undefined) return empty;
  const firstDistance = records[firstIndex]?.distance;
  if (firstDistance === undefined) return empty;

  const moving = movingSeconds(records);
  const analysis: LapAnalysis[] = [];
  const spans: LapSpan[] = [];
  for (const range of splitLapRanges({
    records,
    withDistance,
    firstDistance,
    splitDistanceMetres,
  })) {
    const lap = lapFromSlice({
      records,
      moving,
      indices: withDistance.slice(range.startPos, range.endPos + 1),
      lapIndex: analysis.length,
      partial: range.partial,
    });
    if (!lap) continue;
    analysis.push(lap.analysis);
    spans.push(lap.span);
  }
  return { analysis, spans };
};

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
export const effortWorkAverage = ({
  blocks,
  signal,
}: {
  blocks: EffortBlock[];
  signal: EffortSignal;
}): number | undefined => {
  let weighted = 0;
  let weight = 0;
  for (const block of blocks) {
    if (block.kind !== 'work' || block.signalMean === undefined) continue;
    weighted += block.signalMean * block.movingSec;
    weight += block.movingSec;
  }
  if (weight === 0) return undefined;
  const mean = weighted / weight;
  if (signal !== 'pace') return mean;
  if (mean <= 0) return undefined;
  return 1000 / mean;
};

const recordDistance = ({
  records,
  startIndex,
  endIndex,
}: {
  records: SessionRecord[];
  startIndex: number;
  endIndex: number;
}): number | undefined => {
  const start = records[startIndex]?.distance;
  const end = records[endIndex]?.distance;
  if (start === undefined || end === undefined) return undefined;
  return end - start;
};

export const buildEffortLapSet = ({
  records,
  sport,
  thresholds,
}: {
  records: SessionRecord[];
  sport: Sport;
  thresholds: ResolvedThresholds | undefined;
}): EffortLapResult => {
  if (thresholds === undefined) return { set: null, limitedBy: undefined };
  const detection = detectEfforts({
    records,
    sport,
    thresholds: {
      restHr: thresholds.restHr,
      maxHr: thresholds.maxHr,
      ftp: thresholds.ftp,
      thresholdPaceSecPerKm: thresholds.thresholdPace,
    },
  });
  if (detection.blocks.length === 0 || detection.signal === null) {
    return { set: null, limitedBy: detection.limitedBy };
  }
  const spans: LapSpan[] = [];
  const analysis: LapAnalysis[] = [];
  detection.blocks.forEach((block, lapIndex) => {
    spans.push({ lapIndex, startRecord: block.startIndex, endRecord: block.endIndex });
    const distance = recordDistance({
      records,
      startIndex: block.startIndex,
      endIndex: block.endIndex,
    });
    let paceSecPerKm: number | undefined = undefined;
    if (distance !== undefined && distance > 0 && block.movingSec > 0) {
      paceSecPerKm = (block.movingSec / distance) * 1000;
    }
    analysis.push({
      lapIndex,
      paceSecPerKm,
      distance,
      movingTime: block.movingSec,
      intensity: KIND_INTENSITY[block.kind],
      interval: block.kind === 'work',
      partial: false,
    });
  });
  return {
    set: {
      analysis,
      spans,
      bands: lapBands({ records, spans }),
      hrRecoveries: [],
      efforts: {
        signal: detection.signal,
        limitedBy: detection.limitedBy,
        workAverage: effortWorkAverage({ blocks: detection.blocks, signal: detection.signal }),
      },
    },
    limitedBy: detection.limitedBy,
  };
};

export const effortWorkSet = (set: LapSet): LapSet => ({
  ...set,
  analysis: set.analysis.filter((lap) => lap.interval),
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

export const LAP_SOURCES = ['off', 'device', 'splits', 'efforts'] as const;
export type LapSource = (typeof LAP_SOURCES)[number];

const DEFAULT_SPLIT_DISTANCES: Record<Sport, number> = {
  running: 1000,
  cycling: 5000,
};

const defaultSplitDistance = (sport: Sport): number => DEFAULT_SPLIT_DISTANCES[sport];

export const effectiveSplitDistance = ({
  splitDistance,
  sport,
  sessionMetres,
}: {
  splitDistance: number | null;
  sport: Sport;
  sessionMetres: number;
}): number => {
  if (splitDistance !== null) return splitDistance;
  return Math.min(defaultSplitDistance(sport), splitDistanceRange({ sport, sessionMetres }).max);
};

export interface LapSetEfforts {
  signal: EffortSignal;
  limitedBy: EffortLimiter | undefined;
  /** see `effortWorkAverage` */
  workAverage: number | undefined;
}

export interface LapSet {
  analysis: LapAnalysis[];
  spans: LapSpan[];
  bands: LapBand[];
  hrRecoveries: number[];
  efforts?: LapSetEfforts;
}

interface EffortContext {
  sport: Sport;
  thresholds: ResolvedThresholds | undefined;
}

export const buildDeviceLapSet = ({
  records,
  laps,
}: {
  records: SessionRecord[];
  laps: SessionLap[];
}): LapSet | null => {
  if (laps.length === 0) return null;
  const spans = deviceLapSpans({ records, laps });
  const hrRecoveries: number[] = [];
  for (const pair of detectIntervals(laps)) {
    if (pair.hrDropActiveMaxToRecoveryMin !== undefined) {
      hrRecoveries.push(pair.hrDropActiveMaxToRecoveryMin);
    }
  }
  return {
    analysis: analyzeLaps(laps),
    spans,
    bands: lapBands({ records, spans }),
    hrRecoveries,
  };
};

export const buildLapSet = ({
  records,
  laps,
  source,
  splitDistance,
  effortContext,
}: {
  records: SessionRecord[];
  laps: SessionLap[];
  source: LapSource;
  splitDistance: number;
  effortContext: EffortContext;
}): LapSet | null => {
  switch (source) {
    case 'off':
      return null;
    case 'device':
      return buildDeviceLapSet({ records, laps });
    case 'efforts':
      return buildEffortLapSet({
        records,
        sport: effortContext.sport,
        thresholds: effortContext.thresholds,
      }).set;
    case 'splits': {
      const result = computeDynamicLaps({ records, splitDistanceMetres: splitDistance });
      if (result.analysis.length === 0) return null;
      return {
        analysis: result.analysis,
        spans: result.spans,
        bands: lapBands({ records, spans: result.spans }),
        hrRecoveries: [],
      };
    }
  }
};

export const stepLap = ({
  bands,
  lapIndex,
  direction,
}: {
  bands: LapBand[];
  lapIndex: number;
  direction: -1 | 1;
}): number | undefined => {
  const position = bands.findIndex((band) => band.lapIndex === lapIndex);
  if (position < 0) return undefined;
  return bands[position + direction]?.lapIndex;
};

export const MIN_SUMMARY_LAPS = 2;

interface LapSummary {
  count: number;
  avgSecPerKm: number | undefined;
  fastest: LapAnalysis | undefined;
  slowest: LapAnalysis | undefined;
  intervalWorkout: boolean;
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
  const intervalWorkout = set.analysis.some((lap) => lap.interval);
  let hrRecoveries: number[] = [];
  if (intervalWorkout) {
    hrRecoveries = set.hrRecoveries;
  }
  return {
    count: set.analysis.length,
    avgSecPerKm: averagePace(set.analysis),
    fastest,
    slowest,
    intervalWorkout,
    hrRecoveries,
    avgHrRecovery: averageOf(hrRecoveries),
  };
};
