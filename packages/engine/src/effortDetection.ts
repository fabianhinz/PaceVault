import type { SessionRecord, Sport } from './types.ts';
import { windowedGradients } from './gradient.ts';
import { MAX_MOVING_PAIR_GAP_SEC } from './recordPairs.ts';
import { gradeAdjustedPaceFactor } from './normalizedEffort.ts';
import { peltChangePoints } from './changePoints.ts';

export type EffortSignal = 'power' | 'pace' | 'hr';
export type EffortLimiter = 'ftp' | 'thresholdPace';
export type EffortKind = 'work' | 'rest' | 'steady' | 'warmup' | 'cooldown';

export interface EffortThresholds {
  restHr: number;
  maxHr: number;
  ftp?: number;
  thresholdPaceSecPerKm?: number;
}

export interface EffortBlock {
  kind: EffortKind;
  startSec: number;
  endSec: number;
  startIndex: number;
  endIndex: number;
  movingSec: number;
  /**
   * Mean of the detection signal over the block's moving time: power W, pace grade-adjusted
   * speed m/s, HR bpm (read 30 s ahead). `undefined` when the block has no samples.
   */
  signalMean: number | undefined;
}

interface EffortDetection {
  blocks: EffortBlock[];
  signal: EffortSignal | null;
  limitedBy: EffortLimiter | undefined;
}

interface EffortSignalDefaults {
  minWorkSec: number;
  enterShare: number;
  leaveShare: number;
  steadyShare: number;
}

type BlockKind = EffortKind | 'break';

interface Piece {
  kind: BlockKind;
  from: number;
  to: number;
}

interface Grid {
  length: number;
  offset: number;
  power: Float64Array;
  hr: Float64Array;
  speed: Float64Array;
  record: Int32Array;
  breaks: Uint8Array;
}

interface Bin {
  run: number;
  from: number;
  to: number;
  value: number;
  piece: number;
  hole: boolean;
}

interface Segment {
  from: number;
  to: number;
  mean: number;
}

interface SignalLevels {
  enter: number;
  leave: number;
  steady: number;
}

/**
 * Power factors are × FTP, pace × threshold speed, HR × heart-rate reserve above rest.
 * Power steady 0.75 is the Coggan Z2/Z3 boundary. Work enters at `enterShare` and only ends
 * below `leaveShare` (hysteresis), so a level that wanders around `enterShare` stays one block.
 * @see [CogganAllen2010], [Karvonen1957]
 */
const DEFAULTS_BY_EFFORT_SIGNAL: Record<EffortSignal, EffortSignalDefaults> = {
  power: { minWorkSec: 30, enterShare: 0.88, leaveShare: 0.8, steadyShare: 0.75 },
  pace: { minWorkSec: 60, enterShare: 0.88, leaveShare: 0.85, steadyShare: 0.82 },
  hr: { minWorkSec: 120, enterShare: 0.8, leaveShare: 0.75, steadyShare: 0.7 },
};
const EFFORT_SIGNALS_BY_SPORT: Record<Sport, EffortSignal[]> = {
  cycling: ['power', 'hr'],
  running: ['pace', 'hr'],
};
const LIMITER_BY_EFFORT_SIGNAL: Partial<Record<EffortSignal, EffortLimiter>> = {
  power: 'ftp',
  pace: 'thresholdPace',
};
const EFFORT_BIN_SEC = 5;
/** @see [Killick2012] */
const EFFORT_MIN_SEGMENT_BINS = 6;
/** β = K · σ² · ln n. @see [Killick2012] */
const EFFORT_PENALTY_K = 4;
/** @see [Hampel1974] */
const EFFORT_MAD_SCALE = 0.6745;
const EFFORT_DROPOUT_BINS = 3;
const EFFORT_EDGE_TRACE_SEC = 5;
const EFFORT_EDGE_SEARCH_SEC = 5;
const EFFORT_HR_SHIFT_SEC = 30;
const EFFORT_MAX_BRIDGE_SEC = 130;
const EFFORT_ABSORB_SEC = 20;
const EFFORT_MIN_STEADY_SEC = 300;
const EFFORT_MIN_WARMUP_SEC = 180;
const EFFORT_MIN_COVERAGE = 0.5;
const EFFORT_MAX_WORK_SHARE = 0.8;
const EFFORT_MIN_WORK_BLOCKS = 2;
const EFFORT_MIN_CONTRAST = 1.15;
const MIN_NOISE_SIGMA = 1e-3;

const valueOrNaN = (value: number | undefined): number => {
  if (value === undefined) return NaN;
  return value;
};

const gridSeconds = ({
  records,
  offset,
}: {
  records: SessionRecord[];
  offset: number;
}): number[] => {
  const secondByRecord: number[] = [];
  let previous = 0;
  for (const record of records) {
    const second = Math.max(previous, Math.round(record.timestamp - offset));
    secondByRecord.push(second);
    previous = second;
  }
  return secondByRecord;
};

const fillGrid = ({
  grid,
  records,
  seconds,
}: {
  grid: Grid;
  records: SessionRecord[];
  seconds: number[];
}): Uint8Array => {
  const put = ({ second, index }: { second: number; index: number }) => {
    const record = records[index];
    if (!record) return;
    grid.power[second] = valueOrNaN(record.power);
    grid.hr[second] = valueOrNaN(record.hr);
    grid.speed[second] = valueOrNaN(record.speed);
  };
  const gap = new Uint8Array(grid.length);
  put({ second: 0, index: 0 });
  for (let k = 1; k < records.length; k++) {
    const from = seconds[k - 1];
    const to = seconds[k];
    if (from === undefined || to === undefined) continue;
    for (let second = from + 1; second <= to; second++) grid.record[second] = k;
    if (to - from <= MAX_MOVING_PAIR_GAP_SEC) {
      for (let second = from + 1; second <= to; second++) put({ second, index: k });
    } else {
      for (let second = from + 1; second < to; second++) gap[second] = 1;
      put({ second: to, index: k });
    }
    if (to === from) put({ second: to, index: k });
  }
  return gap;
};

const markBreaks = ({ grid, gap }: { grid: Grid; gap: Uint8Array }): void => {
  const length = grid.length;
  let stoppedRun = 0;
  for (let i = 0; i <= length; i++) {
    const stopped = i < length && grid.speed[i] === 0 && gap[i] === 0;
    if (stopped) {
      stoppedRun++;
      continue;
    }
    if (stoppedRun > MAX_MOVING_PAIR_GAP_SEC) {
      for (let s = i - stoppedRun; s < i; s++) grid.breaks[s] = 1;
    }
    stoppedRun = 0;
  }
  for (let i = 0; i < length; i++) {
    if (gap[i] === 1) grid.breaks[i] = 1;
  }
};

const buildGrid = (records: SessionRecord[]): Grid | undefined => {
  const first = records[0];
  if (!first || records.length < 2) return undefined;
  const offset = first.timestamp;
  const seconds = gridSeconds({ records, offset });
  const length = (seconds[seconds.length - 1] ?? 0) + 1;
  if (length < 2) return undefined;
  const grid: Grid = {
    length,
    offset,
    power: new Float64Array(length).fill(NaN),
    hr: new Float64Array(length).fill(NaN),
    speed: new Float64Array(length).fill(NaN),
    record: new Int32Array(length),
    breaks: new Uint8Array(length),
  };
  const gap = fillGrid({ grid, records, seconds });
  markBreaks({ grid, gap });
  return grid;
};

const signalValueAt = ({
  grid,
  signal,
  gradeFactor,
  second,
}: {
  grid: Grid;
  signal: EffortSignal;
  gradeFactor: (second: number) => number;
  second: number;
}): number => {
  switch (signal) {
    case 'power':
      return valueOrNaN(grid.power[second]);
    case 'pace':
      return valueOrNaN(grid.speed[second]) * gradeFactor(second);
    case 'hr': {
      const shifted = second + EFFORT_HR_SHIFT_SEC;
      if (shifted < grid.length && grid.breaks[shifted] === 0) return valueOrNaN(grid.hr[shifted]);
      return NaN;
    }
  }
};

const signalSeries = ({
  grid,
  signal,
  gradeFactor,
}: {
  grid: Grid;
  signal: EffortSignal;
  gradeFactor: (second: number) => number;
}): Float64Array => {
  const series = new Float64Array(grid.length).fill(NaN);
  for (let i = 0; i < grid.length; i++) {
    if (grid.breaks[i] === 1) continue;
    series[i] = signalValueAt({ grid, signal, gradeFactor, second: i });
  }
  return series;
};

const coverage = ({ grid, series }: { grid: Grid; series: Float64Array }): number => {
  let moving = 0;
  let valued = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid.breaks[i] === 1) continue;
    moving++;
    if (!Number.isNaN(series[i])) valued++;
  }
  if (moving === 0) return 0;
  return valued / moving;
};

const runsOf = (breaks: Uint8Array): Array<[number, number]> => {
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i <= breaks.length; i++) {
    const broken = i === breaks.length || breaks[i] === 1;
    if (!broken && start < 0) start = i;
    if (broken && start >= 0) {
      runs.push([start, i]);
      start = -1;
    }
  }
  return runs;
};

const meanOf = ({
  series,
  from,
  to,
}: {
  series: Float64Array;
  from: number;
  to: number;
}): number => {
  let sum = 0;
  let count = 0;
  for (let i = from; i < to; i++) {
    const value = series[i];
    if (value === undefined || Number.isNaN(value)) continue;
    sum += value;
    count++;
  }
  if (count === 0) return NaN;
  return sum / count;
};

const definedMean = ({
  series,
  from,
  to,
}: {
  series: Float64Array;
  from: number;
  to: number;
}): number | undefined => {
  const mean = meanOf({ series, from, to });
  if (Number.isNaN(mean)) return undefined;
  return mean;
};

const smooth = ({
  series,
  breaks,
  window,
}: {
  series: Float64Array;
  breaks: Uint8Array;
  window: number;
}): Float64Array => {
  const smoothed = new Float64Array(series.length).fill(NaN);
  const half = Math.floor(window / 2);
  for (const run of runsOf(breaks)) {
    for (let i = run[0]; i < run[1]; i++) {
      smoothed[i] = meanOf({
        series,
        from: Math.max(run[0], i - half),
        to: Math.min(run[1], i + half + 1),
      });
    }
  }
  return smoothed;
};

const median = (values: number[]): number => {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? NaN;
};

const binsOfRuns = ({ series, breaks }: { series: Float64Array; breaks: Uint8Array }): Bin[] => {
  const bins: Bin[] = [];
  runsOf(breaks).forEach((run, runIndex) => {
    const count = Math.max(1, Math.floor((run[1] - run[0]) / EFFORT_BIN_SEC));
    for (let k = 0; k < count; k++) {
      const from = run[0] + k * EFFORT_BIN_SEC;
      let to = from + EFFORT_BIN_SEC;
      if (k === count - 1) to = run[1];
      bins.push({
        run: runIndex,
        from,
        to,
        value: meanOf({ series, from, to }),
        piece: 0,
        hole: false,
      });
    }
  });
  return bins;
};

const dropoutEnd = ({ bins, start }: { bins: Bin[]; start: number }): number => {
  const run = bins[start]?.run;
  let end = start;
  while (end < bins.length) {
    const next = bins[end];
    if (!next || !Number.isNaN(next.value) || next.run !== run) break;
    end++;
  }
  return end;
};

const assignPieces = (bins: Bin[]): void => {
  let piece = 0;
  for (let k = 0; k < bins.length; k++) {
    const bin = bins[k];
    if (!bin) continue;
    if (k > 0 && bins[k - 1]?.run !== bin.run) piece++;
    if (!Number.isNaN(bin.value)) {
      bin.piece = piece;
      continue;
    }
    const end = dropoutEnd({ bins, start: k });
    if (end - k < EFFORT_DROPOUT_BINS) {
      bin.piece = piece;
      continue;
    }
    piece++;
    for (let j = k; j < end; j++) {
      const hole = bins[j];
      if (!hole) continue;
      hole.piece = piece;
      hole.hole = true;
    }
    piece++;
    k = end - 1;
  }
};

const fillFromNeighbours = (bins: Bin[]): void => {
  for (let k = 1; k < bins.length; k++) {
    const bin = bins[k];
    const before = bins[k - 1];
    if (!bin || !before || bin.hole || !Number.isNaN(bin.value)) continue;
    if (before.piece === bin.piece) bin.value = before.value;
  }
  for (let k = bins.length - 2; k >= 0; k--) {
    const bin = bins[k];
    const after = bins[k + 1];
    if (!bin || !after || bin.hole || !Number.isNaN(bin.value)) continue;
    if (after.piece === bin.piece) bin.value = after.value;
  }
};

const buildBins = ({ series, breaks }: { series: Float64Array; breaks: Uint8Array }): Bin[] => {
  const bins = binsOfRuns({ series, breaks });
  assignPieces(bins);
  fillFromNeighbours(bins);
  return bins;
};

/** σ from the MAD of neighbouring bin differences. @see [Hampel1974] */
const noiseSigma = (bins: Bin[]): number => {
  const diffs: number[] = [];
  for (let k = 1; k < bins.length; k++) {
    const bin = bins[k];
    const before = bins[k - 1];
    if (!bin || !before || bin.run !== before.run) continue;
    if (Number.isNaN(bin.value) || Number.isNaN(before.value)) continue;
    diffs.push(Math.abs(bin.value - before.value));
  }
  const sigma = median(diffs) / (EFFORT_MAD_SCALE * Math.SQRT2);
  if (!Number.isFinite(sigma) || sigma < MIN_NOISE_SIGMA) return MIN_NOISE_SIGMA;
  return sigma;
};

const peltSegments = ({
  series,
  breaks,
}: {
  series: Float64Array;
  breaks: Uint8Array;
}): Segment[] => {
  const bins = buildBins({ series, breaks });
  const sigma = noiseSigma(bins);
  const beta = EFFORT_PENALTY_K * sigma * sigma * Math.log(Math.max(2, bins.length));
  const pieces = new Map<number, Bin[]>();
  for (const bin of bins) {
    const group = pieces.get(bin.piece);
    if (group) group.push(bin);
    else pieces.set(bin.piece, [bin]);
  }
  const segments: Segment[] = [];
  for (const group of pieces.values()) {
    const head = group[0];
    const tail = group[group.length - 1];
    if (!head || !tail) continue;
    if (group.every((bin) => Number.isNaN(bin.value))) {
      segments.push({ from: head.from, to: tail.to, mean: NaN });
      continue;
    }
    const bounds = [
      0,
      ...peltChangePoints({
        values: group.map((bin) => bin.value),
        beta,
        minBins: EFFORT_MIN_SEGMENT_BINS,
      }),
      group.length,
    ];
    for (let k = 0; k < bounds.length - 1; k++) {
      const start = group[bounds[k] ?? 0];
      const end = group[(bounds[k + 1] ?? group.length) - 1];
      if (!start || !end) continue;
      segments.push({
        from: start.from,
        to: end.to,
        mean: meanOf({ series, from: start.from, to: end.to }),
      });
    }
  }
  return segments.sort((a, b) => a.from - b.from);
};

const movingLength = ({ grid, from, to }: { grid: Grid; from: number; to: number }): number => {
  let movingSec = 0;
  for (let i = from; i < to; i++) {
    if (grid.breaks[i] === 0) movingSec++;
  }
  return movingSec;
};

const merge = (pieces: Piece[]): Piece[] => {
  const merged: Piece[] = [];
  for (const piece of pieces) {
    const previous = merged[merged.length - 1];
    if (previous && previous.kind === piece.kind && previous.to === piece.from) {
      previous.to = piece.to;
    } else {
      merged.push({ kind: piece.kind, from: piece.from, to: piece.to });
    }
  }
  return merged;
};

const isShortNonWork = (piece: Piece | undefined): boolean =>
  piece !== undefined &&
  piece.kind !== 'work' &&
  piece.kind !== 'break' &&
  piece.to - piece.from < EFFORT_ABSORB_SEC;

const bridgeBreaks = (pieces: Piece[]): Piece[] => {
  const bridged = [...pieces];
  for (let i = 1; i < bridged.length - 1; i++) {
    const gap = bridged[i];
    if (!gap || gap.kind !== 'break' || gap.to - gap.from > EFFORT_MAX_BRIDGE_SEC) continue;
    let left = i - 1;
    let right = i + 1;
    if (isShortNonWork(bridged[left])) left--;
    if (isShortNonWork(bridged[right])) right++;
    const leftPiece = bridged[left];
    const rightPiece = bridged[right];
    if (leftPiece?.kind !== 'work' || rightPiece?.kind !== 'work') continue;
    bridged.splice(left, right - left + 1, {
      kind: 'work',
      from: leftPiece.from,
      to: rightPiece.to,
    });
    i = left;
  }
  return bridged;
};

const fillShortGapsBetweenWork = (pieces: Piece[]): Piece[] => {
  for (let i = 1; i < pieces.length - 1; i++) {
    const piece = pieces[i];
    const before = pieces[i - 1];
    const after = pieces[i + 1];
    if (!piece || !before || !after || !isShortNonWork(piece)) continue;
    if (before.kind !== 'work' || after.kind !== 'work') continue;
    if (before.to === piece.from && piece.to === after.from) piece.kind = 'work';
  }
  return pieces;
};

const refineEdges = ({
  pieces,
  series,
  trace,
}: {
  pieces: Piece[];
  series: Float64Array;
  trace: Float64Array;
}): Piece[] => {
  for (let i = 1; i < pieces.length; i++) {
    const before = pieces[i - 1];
    const current = pieces[i];
    if (!before || !current || before.kind === 'break' || current.kind === 'break') continue;
    if ((before.kind === 'work') === (current.kind === 'work')) continue;
    const level =
      (meanOf({ series, from: before.from, to: before.to }) +
        meanOf({ series, from: current.from, to: current.to })) /
      2;
    if (Number.isNaN(level)) continue;
    const falling = before.kind === 'work';
    let best: number | undefined = undefined;
    const low = Math.max(before.from + 1, current.from - EFFORT_EDGE_SEARCH_SEC);
    const high = Math.min(current.to - 1, current.from + EFFORT_EDGE_SEARCH_SEC);
    for (let j = low; j <= high; j++) {
      const previousTrace = trace[j - 1];
      const currentTrace = trace[j];
      if (
        previousTrace === undefined ||
        currentTrace === undefined ||
        Number.isNaN(previousTrace) ||
        Number.isNaN(currentTrace)
      )
        continue;
      let crosses = previousTrace < level && currentTrace >= level;
      if (falling) crosses = previousTrace >= level && currentTrace < level;
      if (!crosses) continue;
      if (best === undefined || Math.abs(j - current.from) < Math.abs(best - current.from)) {
        best = j;
      }
    }
    if (best !== undefined) {
      before.to = best;
      current.from = best;
    }
  }
  return pieces.filter((piece) => piece.to > piece.from);
};

const headStart = ({ pieces, firstWork }: { pieces: Piece[]; firstWork: number }): number => {
  let start = firstWork;
  while (start > 0 && pieces[start - 1]?.kind !== 'break') start--;
  return start;
};

const tailEnd = ({ pieces, lastWork }: { pieces: Piece[]; lastWork: number }): number => {
  let end = lastWork;
  while (end < pieces.length - 1 && pieces[end + 1]?.kind !== 'break') end++;
  return end;
};

const cooldownPiece = ({
  pieces,
  lastWork,
  end,
}: {
  pieces: Piece[];
  lastWork: number;
  end: number;
}): Piece | undefined => {
  const tailFirst = pieces[lastWork + 1];
  const tailLast = pieces[end];
  if (
    end > lastWork &&
    tailFirst &&
    tailLast &&
    tailLast.to - tailFirst.from >= EFFORT_MIN_WARMUP_SEC
  ) {
    return { kind: 'cooldown', from: tailFirst.from, to: tailLast.to };
  }
  return undefined;
};

const warmupPiece = ({
  pieces,
  start,
  firstWork,
}: {
  pieces: Piece[];
  start: number;
  firstWork: number;
}): Piece | undefined => {
  const headFirst = pieces[start];
  const headLast = pieces[firstWork - 1];
  if (
    firstWork > start &&
    headFirst &&
    headLast &&
    headLast.to - headFirst.from >= EFFORT_MIN_WARMUP_SEC
  ) {
    return { kind: 'warmup', from: headFirst.from, to: headLast.to };
  }
  return undefined;
};

const markWarmupCooldown = (pieces: Piece[]): Piece[] => {
  const firstWork = pieces.findIndex((piece) => piece.kind === 'work');
  const lastWork = pieces.findLastIndex((piece) => piece.kind === 'work');
  if (firstWork < 0) return pieces;
  const start = headStart({ pieces, firstWork });
  const end = tailEnd({ pieces, lastWork });
  const marked = [...pieces];
  const cooldown = cooldownPiece({ pieces, lastWork, end });
  if (cooldown) marked.splice(lastWork + 1, end - lastWork, cooldown);
  const warmup = warmupPiece({ pieces, start, firstWork });
  if (warmup) marked.splice(start, firstWork - start, warmup);
  return marked;
};

const postprocess = ({
  pieces,
  grid,
  series,
  defaults,
}: {
  pieces: Piece[];
  grid: Grid;
  series: Float64Array;
  defaults: EffortSignalDefaults;
}): Piece[] => {
  let processed = bridgeBreaks(merge(pieces));
  for (const piece of processed) {
    if (
      piece.kind === 'work' &&
      movingLength({ grid, from: piece.from, to: piece.to }) < defaults.minWorkSec
    ) {
      piece.kind = 'rest';
    }
  }
  processed = merge(fillShortGapsBetweenWork(merge(processed)));
  for (const piece of processed) {
    if (piece.kind === 'steady' && piece.to - piece.from < EFFORT_MIN_STEADY_SEC)
      piece.kind = 'rest';
  }
  const trace = smooth({ series, breaks: grid.breaks, window: EFFORT_EDGE_TRACE_SEC });
  return markWarmupCooldown(refineEdges({ pieces: merge(processed), series, trace }));
};

const workSegments = ({
  segments,
  levels,
}: {
  segments: Segment[];
  levels: SignalLevels;
}): boolean[] => {
  const working = segments.map((segment) => segment.mean >= levels.enter);
  const isContiguous = ({
    from,
    into,
  }: {
    from: Segment | undefined;
    into: Segment | undefined;
  }): boolean => from !== undefined && into !== undefined && from.to === into.from;
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (working[i] || working[i - 1] !== true || !segment || segment.mean < levels.leave) continue;
    if (isContiguous({ from: segments[i - 1], into: segment })) working[i] = true;
  }
  for (let i = segments.length - 2; i >= 0; i--) {
    const segment = segments[i];
    if (working[i] || working[i + 1] !== true || !segment || segment.mean < levels.leave) continue;
    if (isContiguous({ from: segment, into: segments[i + 1] })) working[i] = true;
  }
  return working;
};

const labelSegments = ({
  segments,
  length,
  levels,
}: {
  segments: Segment[];
  length: number;
  levels: SignalLevels;
}): Piece[] => {
  const working = workSegments({ segments, levels });
  const pieces: Piece[] = [];
  let previousEnd = 0;
  for (const [index, segment] of segments.entries()) {
    if (segment.from > previousEnd) {
      pieces.push({ kind: 'break', from: previousEnd, to: segment.from });
    }
    let kind: BlockKind = 'rest';
    if (working[index] === true) kind = 'work';
    else if (segment.mean >= levels.steady) kind = 'steady';
    pieces.push({ kind, from: segment.from, to: segment.to });
    previousEnd = segment.to;
  }
  if (previousEnd < length) pieces.push({ kind: 'break', from: previousEnd, to: length });
  return pieces;
};

const isDetectionPlausible = ({
  pieces,
  grid,
  series,
}: {
  pieces: Piece[];
  grid: Grid;
  series: Float64Array;
}): boolean => {
  let movingSec = 0;
  let workSec = 0;
  let workSum = 0;
  let workCount = 0;
  let otherSum = 0;
  let otherCount = 0;
  let workBlocks = 0;
  for (const piece of pieces) {
    if (piece.kind === 'break') continue;
    if (piece.kind === 'work') workBlocks++;
    for (let i = piece.from; i < piece.to; i++) {
      if (grid.breaks[i] === 1) continue;
      movingSec++;
      if (piece.kind === 'work') workSec++;
      const value = series[i];
      if (value === undefined || Number.isNaN(value)) continue;
      if (piece.kind === 'work') {
        workSum += value;
        workCount++;
      } else {
        otherSum += value;
        otherCount++;
      }
    }
  }
  if (movingSec === 0 || workSec / movingSec > EFFORT_MAX_WORK_SHARE) return false;
  if (workBlocks < EFFORT_MIN_WORK_BLOCKS) return false;
  if (workCount === 0 || otherCount === 0) return false;
  return workSum / workCount >= EFFORT_MIN_CONTRAST * (otherSum / otherCount);
};

const referenceOf = ({
  signal,
  thresholds,
  factor,
}: {
  signal: EffortSignal;
  thresholds: EffortThresholds;
  factor: number;
}): number | undefined => {
  switch (signal) {
    case 'power':
      if (thresholds.ftp === undefined || thresholds.ftp <= 0) return undefined;
      return factor * thresholds.ftp;
    case 'pace':
      if (thresholds.thresholdPaceSecPerKm === undefined || thresholds.thresholdPaceSecPerKm <= 0)
        return undefined;
      return factor * (1000 / thresholds.thresholdPaceSecPerKm);
    case 'hr':
      /** @see [Karvonen1957] */
      return thresholds.restHr + factor * (thresholds.maxHr - thresholds.restHr);
  }
};

const chooseSignal = ({
  grid,
  sport,
  thresholds,
}: {
  grid: Grid;
  sport: Sport;
  thresholds: EffortThresholds;
}): { signal: EffortSignal | null; limitedBy: EffortLimiter | undefined } => {
  let limitedBy: EffortLimiter | undefined = undefined;
  for (const signal of EFFORT_SIGNALS_BY_SPORT[sport]) {
    const probe = signalSeries({ grid, signal, gradeFactor: () => 1 });
    if (coverage({ grid, series: probe }) < EFFORT_MIN_COVERAGE) continue;
    if (referenceOf({ signal, thresholds, factor: 1 }) === undefined) {
      limitedBy = LIMITER_BY_EFFORT_SIGNAL[signal];
      continue;
    }
    return { signal, limitedBy };
  }
  return { signal: null, limitedBy };
};

const signalLevels = ({
  signal,
  thresholds,
  defaults,
}: {
  signal: EffortSignal;
  thresholds: EffortThresholds;
  defaults: EffortSignalDefaults;
}): SignalLevels | undefined => {
  const enter = referenceOf({ signal, thresholds, factor: defaults.enterShare });
  const leave = referenceOf({ signal, thresholds, factor: defaults.leaveShare });
  const steady = referenceOf({ signal, thresholds, factor: defaults.steadyShare });
  if (enter === undefined || leave === undefined || steady === undefined) return undefined;
  return { enter, leave, steady };
};

const gradeFactorFor = ({
  signal,
  records,
  grid,
}: {
  signal: EffortSignal;
  records: SessionRecord[];
  grid: Grid;
}): ((second: number) => number) => {
  let gradeFactor = (_second: number): number => 1;
  if (signal === 'pace') {
    const perRecord = windowedGradients(records);
    gradeFactor = (second) => gradeAdjustedPaceFactor(perRecord[grid.record[second] ?? 0] ?? 0);
  }
  return gradeFactor;
};

const blocksFromPieces = ({
  pieces,
  grid,
  series,
}: {
  pieces: Piece[];
  grid: Grid;
  series: Float64Array;
}): EffortBlock[] => {
  const blocks: EffortBlock[] = [];
  for (const piece of pieces) {
    if (piece.kind === 'break') continue;
    let endSecond = piece.to - 1;
    if (piece.to < grid.length && grid.breaks[piece.to] === 0) endSecond = piece.to;
    blocks.push({
      kind: piece.kind,
      startSec: grid.offset + piece.from,
      endSec: grid.offset + piece.to,
      startIndex: grid.record[piece.from] ?? 0,
      endIndex: grid.record[endSecond] ?? 0,
      movingSec: movingLength({ grid, from: piece.from, to: piece.to }),
      signalMean: definedMean({ series, from: piece.from, to: piece.to }),
    });
  }
  return blocks;
};

export const detectEfforts = ({
  records,
  sport,
  thresholds,
}: {
  records: SessionRecord[];
  sport: Sport;
  thresholds: EffortThresholds;
}): EffortDetection => {
  const grid = buildGrid(records);
  if (!grid) return { blocks: [], signal: null, limitedBy: undefined };

  const choice = chooseSignal({ grid, sport, thresholds });
  if (choice.signal === null) return { blocks: [], signal: null, limitedBy: choice.limitedBy };

  const defaults = DEFAULTS_BY_EFFORT_SIGNAL[choice.signal];
  const levels = signalLevels({ signal: choice.signal, thresholds, defaults });
  if (!levels) return { blocks: [], signal: choice.signal, limitedBy: choice.limitedBy };

  const gradeFactor = gradeFactorFor({ signal: choice.signal, records, grid });
  const series = signalSeries({ grid, signal: choice.signal, gradeFactor });
  const pieces = postprocess({
    pieces: labelSegments({
      segments: peltSegments({ series, breaks: grid.breaks }),
      length: grid.length,
      levels,
    }),
    grid,
    series,
    defaults,
  });
  if (!isDetectionPlausible({ pieces, grid, series }))
    return { blocks: [], signal: choice.signal, limitedBy: choice.limitedBy };

  return {
    blocks: blocksFromPieces({ pieces, grid, series }),
    signal: choice.signal,
    limitedBy: choice.limitedBy,
  };
};
