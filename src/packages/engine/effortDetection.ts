import type { SessionRecord, Sport } from './types.ts';
import { windowedGradients } from './gradient.ts';
import { MAX_MOVING_PAIR_GAP_S, gradeAdjustedPaceFactor } from './normalize.ts';

export type EffortSignal = 'power' | 'pace' | 'hr';
export type EffortLimiter = 'ftp' | 'thresholdPace';
export type EffortKind = 'work' | 'rest' | 'steady' | 'warmup' | 'cooldown';

export interface EffortThresholds {
  restHr: number;
  maxHr: number;
  ftp?: number;
  /** sec/km */
  thresholdPace?: number;
}

export interface EffortBlock {
  kind: EffortKind;
  /** elapsed seconds since the first record */
  start: number;
  /** elapsed seconds since the first record */
  end: number;
  startIndex: number;
  endIndex: number;
  /** seconds, break seconds (bridged stops) excluded */
  movingTime: number;
}

export interface EffortDetection {
  blocks: EffortBlock[];
  signal: EffortSignal | null;
  limitedBy: EffortLimiter | undefined;
}

export interface EffortSignalDefaults {
  /** seconds of moving time a work block needs */
  minWork: number;
  /** work at or above this share of the reference */
  enter: number;
  /** steady at or above this share of the reference */
  steady: number;
}

/**
 * Power factors are × FTP, pace × threshold speed, HR × heart-rate reserve above rest.
 * Power steady 0.75 is the Coggan Z2/Z3 boundary.
 * @see [CogganAllen2010], [Karvonen1957]
 */
export const EFFORT_SIGNAL_DEFAULTS: Record<EffortSignal, EffortSignalDefaults> = {
  power: { minWork: 30, enter: 0.88, steady: 0.75 },
  pace: { minWork: 60, enter: 0.88, steady: 0.82 },
  hr: { minWork: 120, enter: 0.8, steady: 0.7 },
};
export const EFFORT_SIGNAL_ORDER: Record<Sport, EffortSignal[]> = {
  cycling: ['power', 'hr'],
  running: ['pace', 'hr'],
};
export const EFFORT_SIGNAL_LIMITERS: Partial<Record<EffortSignal, EffortLimiter>> = {
  power: 'ftp',
  pace: 'thresholdPace',
};
export const EFFORT_BIN_S = 5;
/** @see [Killick2012] */
export const EFFORT_MIN_SEGMENT_BINS = 6;
/** β = K · σ² · ln n. @see [Killick2012] */
export const EFFORT_PENALTY_K = 4;
/** @see [Hampel1974] */
export const EFFORT_MAD_SCALE = 0.6745;
export const EFFORT_DROPOUT_BINS = 3;
export const EFFORT_EDGE_TRACE_S = 5;
export const EFFORT_EDGE_SEARCH_S = 5;
export const EFFORT_HR_SHIFT_S = 30;
export const EFFORT_MAX_BRIDGE_S = 130;
export const EFFORT_ABSORB_S = 20;
export const EFFORT_MIN_STEADY_S = 300;
export const EFFORT_MIN_WARMUP_S = 180;
export const EFFORT_MIN_COVERAGE = 0.5;
export const EFFORT_MAX_WORK_SHARE = 0.8;
export const EFFORT_MIN_WORK_BLOCKS = 2;
export const EFFORT_MIN_CONTRAST = 1.15;

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
  isBreak: Uint8Array;
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

const valueOrNaN = (value: number | undefined): number => {
  if (value === undefined) return NaN;
  return value;
};

const buildGrid = (records: SessionRecord[]): Grid | undefined => {
  const first = records[0];
  if (!first || records.length < 2) return undefined;
  const offset = first.timestamp;
  const seconds: number[] = [];
  let previous = 0;
  for (const record of records) {
    const second = Math.max(previous, Math.round(record.timestamp - offset));
    seconds.push(second);
    previous = second;
  }
  const length = previous + 1;
  if (length < 2) return undefined;
  const grid: Grid = {
    length,
    offset,
    power: new Float64Array(length).fill(NaN),
    hr: new Float64Array(length).fill(NaN),
    speed: new Float64Array(length).fill(NaN),
    record: new Int32Array(length),
    isBreak: new Uint8Array(length),
  };
  const put = (second: number, index: number) => {
    const record = records[index];
    if (!record) return;
    grid.power[second] = valueOrNaN(record.power);
    grid.hr[second] = valueOrNaN(record.hr);
    grid.speed[second] = valueOrNaN(record.speed);
  };
  const gap = new Uint8Array(length);
  put(0, 0);
  for (let k = 1; k < records.length; k++) {
    const from = seconds[k - 1];
    const to = seconds[k];
    if (from === undefined || to === undefined) continue;
    for (let s = from + 1; s <= to; s++) grid.record[s] = k;
    if (to - from <= MAX_MOVING_PAIR_GAP_S) {
      for (let s = from + 1; s <= to; s++) put(s, k);
    } else {
      for (let s = from + 1; s < to; s++) gap[s] = 1;
      put(to, k);
    }
    if (to === from) put(to, k);
  }
  let stopped = 0;
  for (let i = 0; i <= length; i++) {
    const isStopped = i < length && grid.speed[i] === 0 && gap[i] === 0;
    if (isStopped) {
      stopped++;
      continue;
    }
    if (stopped > MAX_MOVING_PAIR_GAP_S) {
      for (let s = i - stopped; s < i; s++) grid.isBreak[s] = 1;
    }
    stopped = 0;
  }
  for (let i = 0; i < length; i++) {
    if (gap[i] === 1) grid.isBreak[i] = 1;
  }
  return grid;
};

const signalSeries = (
  grid: Grid,
  signal: EffortSignal,
  gradeFactor: (second: number) => number,
): Float64Array => {
  const x = new Float64Array(grid.length).fill(NaN);
  for (let i = 0; i < grid.length; i++) {
    if (grid.isBreak[i] === 1) continue;
    if (signal === 'power') {
      x[i] = valueOrNaN(grid.power[i]);
    } else if (signal === 'pace') {
      x[i] = valueOrNaN(grid.speed[i]) * gradeFactor(i);
    } else {
      const j = i + EFFORT_HR_SHIFT_S;
      if (j < grid.length && grid.isBreak[j] === 0) x[i] = valueOrNaN(grid.hr[j]);
    }
  }
  return x;
};

const coverage = (grid: Grid, x: Float64Array): number => {
  let moving = 0;
  let valued = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid.isBreak[i] === 1) continue;
    moving++;
    if (!Number.isNaN(x[i])) valued++;
  }
  if (moving === 0) return 0;
  return valued / moving;
};

const runsOf = (isBreak: Uint8Array): Array<[number, number]> => {
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i <= isBreak.length; i++) {
    const broken = i === isBreak.length || isBreak[i] === 1;
    if (!broken && start < 0) start = i;
    if (broken && start >= 0) {
      runs.push([start, i]);
      start = -1;
    }
  }
  return runs;
};

const meanOf = (x: Float64Array, from: number, to: number): number => {
  let sum = 0;
  let count = 0;
  for (let i = from; i < to; i++) {
    const value = x[i];
    if (value === undefined || Number.isNaN(value)) continue;
    sum += value;
    count++;
  }
  if (count === 0) return NaN;
  return sum / count;
};

const smooth = (x: Float64Array, isBreak: Uint8Array, window: number): Float64Array => {
  const out = new Float64Array(x.length).fill(NaN);
  const half = Math.floor(window / 2);
  for (const run of runsOf(isBreak)) {
    for (let i = run[0]; i < run[1]; i++) {
      out[i] = meanOf(x, Math.max(run[0], i - half), Math.min(run[1], i + half + 1));
    }
  }
  return out;
};

const median = (values: number[]): number => {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? NaN;
};

/** Optimal partitioning with pruning, Gaussian mean-shift cost. @see [Killick2012] */
const pelt = (values: number[], beta: number, minBins: number): number[] => {
  const n = values.length;
  if (n < 2 * minBins) return [];
  const sums = new Float64Array(n + 1);
  const squares = new Float64Array(n + 1);
  values.forEach((value, i) => {
    sums[i + 1] = (sums[i] ?? 0) + value;
    squares[i + 1] = (squares[i] ?? 0) + value * value;
  });
  const cost = (s: number, e: number): number => {
    const sum = (sums[e] ?? 0) - (sums[s] ?? 0);
    return (squares[e] ?? 0) - (squares[s] ?? 0) - (sum * sum) / (e - s);
  };
  const best = new Float64Array(n + 1).fill(Infinity);
  best[0] = -beta;
  const last = new Int32Array(n + 1);
  let candidates: number[] = [0];
  for (let e = minBins; e <= n; e++) {
    const fresh = e - minBins;
    if (fresh >= minBins && (best[fresh] ?? Infinity) < Infinity) candidates.push(fresh);
    let value = Infinity;
    let arg = 0;
    for (const s of candidates) {
      if (e - s < minBins) continue;
      const total = (best[s] ?? Infinity) + cost(s, e) + beta;
      if (total < value) {
        value = total;
        arg = s;
      }
    }
    best[e] = value;
    last[e] = arg;
    if (value < Infinity) {
      candidates = candidates.filter(
        (s) => e - s < minBins || (best[s] ?? Infinity) + cost(s, e) <= value,
      );
    }
  }
  const changes: number[] = [];
  let e = n;
  while (e > 0) {
    const s = last[e] ?? 0;
    if (s > 0) changes.push(s);
    e = s;
  }
  return changes.reverse();
};

const buildBins = (x: Float64Array, isBreak: Uint8Array): Bin[] => {
  const bins: Bin[] = [];
  runsOf(isBreak).forEach((run, runIndex) => {
    const count = Math.max(1, Math.floor((run[1] - run[0]) / EFFORT_BIN_S));
    for (let k = 0; k < count; k++) {
      const from = run[0] + k * EFFORT_BIN_S;
      let to = from + EFFORT_BIN_S;
      if (k === count - 1) to = run[1];
      bins.push({ run: runIndex, from, to, value: meanOf(x, from, to), piece: 0, hole: false });
    }
  });
  let piece = 0;
  for (let k = 0; k < bins.length; k++) {
    const bin = bins[k];
    if (!bin) continue;
    if (k > 0 && bins[k - 1]?.run !== bin.run) piece++;
    if (Number.isNaN(bin.value)) {
      let end = k;
      while (end < bins.length) {
        const next = bins[end];
        if (!next || !Number.isNaN(next.value) || next.run !== bin.run) break;
        end++;
      }
      if (end - k >= EFFORT_DROPOUT_BINS) {
        piece++;
        for (let j = k; j < end; j++) {
          const hole = bins[j];
          if (!hole) continue;
          hole.piece = piece;
          hole.hole = true;
        }
        piece++;
        k = end - 1;
        continue;
      }
    }
    bin.piece = piece;
  }
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
  if (!Number.isFinite(sigma) || sigma < 1e-3) return 1e-3;
  return sigma;
};

const peltSegments = (x: Float64Array, isBreak: Uint8Array): Segment[] => {
  const bins = buildBins(x, isBreak);
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
      ...pelt(
        group.map((bin) => bin.value),
        beta,
        EFFORT_MIN_SEGMENT_BINS,
      ),
      group.length,
    ];
    for (let k = 0; k < bounds.length - 1; k++) {
      const start = group[bounds[k] ?? 0];
      const end = group[(bounds[k + 1] ?? group.length) - 1];
      if (!start || !end) continue;
      segments.push({ from: start.from, to: end.to, mean: meanOf(x, start.from, end.to) });
    }
  }
  return segments.sort((a, b) => a.from - b.from);
};

const movingLength = (grid: Grid, from: number, to: number): number => {
  let seconds = 0;
  for (let i = from; i < to; i++) {
    if (grid.isBreak[i] === 0) seconds++;
  }
  return seconds;
};

const merge = (pieces: Piece[]): Piece[] => {
  const out: Piece[] = [];
  for (const piece of pieces) {
    const previous = out[out.length - 1];
    if (previous && previous.kind === piece.kind && previous.to === piece.from) {
      previous.to = piece.to;
    } else {
      out.push({ kind: piece.kind, from: piece.from, to: piece.to });
    }
  }
  return out;
};

const isShortNonWork = (piece: Piece | undefined): boolean =>
  piece !== undefined &&
  piece.kind !== 'work' &&
  piece.kind !== 'break' &&
  piece.to - piece.from < EFFORT_ABSORB_S;

const bridgeBreaks = (pieces: Piece[]): Piece[] => {
  const out = [...pieces];
  for (let i = 1; i < out.length - 1; i++) {
    const gap = out[i];
    if (!gap || gap.kind !== 'break' || gap.to - gap.from > EFFORT_MAX_BRIDGE_S) continue;
    let left = i - 1;
    let right = i + 1;
    if (isShortNonWork(out[left])) left--;
    if (isShortNonWork(out[right])) right++;
    const leftPiece = out[left];
    const rightPiece = out[right];
    if (leftPiece?.kind !== 'work' || rightPiece?.kind !== 'work') continue;
    out.splice(left, right - left + 1, { kind: 'work', from: leftPiece.from, to: rightPiece.to });
    i = left;
  }
  return out;
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

/** Moves work / non-work edges to the mid-level crossing of the 5 s trace. */
const refineEdges = (pieces: Piece[], x: Float64Array, trace: Float64Array): Piece[] => {
  for (let i = 1; i < pieces.length; i++) {
    const before = pieces[i - 1];
    const current = pieces[i];
    if (!before || !current || before.kind === 'break' || current.kind === 'break') continue;
    if ((before.kind === 'work') === (current.kind === 'work')) continue;
    const level = (meanOf(x, before.from, before.to) + meanOf(x, current.from, current.to)) / 2;
    if (Number.isNaN(level)) continue;
    const falling = before.kind === 'work';
    let best: number | undefined = undefined;
    const lo = Math.max(before.from + 1, current.from - EFFORT_EDGE_SEARCH_S);
    const hi = Math.min(current.to - 1, current.from + EFFORT_EDGE_SEARCH_S);
    for (let j = lo; j <= hi; j++) {
      const a = trace[j - 1];
      const b = trace[j];
      if (a === undefined || b === undefined || Number.isNaN(a) || Number.isNaN(b)) continue;
      let crosses = a < level && b >= level;
      if (falling) crosses = a >= level && b < level;
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

const markWarmupCooldown = (pieces: Piece[]): Piece[] => {
  const firstWork = pieces.findIndex((piece) => piece.kind === 'work');
  const lastWork = pieces.findLastIndex((piece) => piece.kind === 'work');
  if (firstWork < 0) return pieces;
  let start = firstWork;
  while (start > 0 && pieces[start - 1]?.kind !== 'break') start--;
  let end = lastWork;
  while (end < pieces.length - 1 && pieces[end + 1]?.kind !== 'break') end++;
  const out = [...pieces];
  const tailFirst = pieces[lastWork + 1];
  const tailLast = pieces[end];
  if (
    end > lastWork &&
    tailFirst &&
    tailLast &&
    tailLast.to - tailFirst.from >= EFFORT_MIN_WARMUP_S
  ) {
    out.splice(lastWork + 1, end - lastWork, {
      kind: 'cooldown',
      from: tailFirst.from,
      to: tailLast.to,
    });
  }
  const headFirst = pieces[start];
  const headLast = pieces[firstWork - 1];
  if (
    firstWork > start &&
    headFirst &&
    headLast &&
    headLast.to - headFirst.from >= EFFORT_MIN_WARMUP_S
  ) {
    out.splice(start, firstWork - start, { kind: 'warmup', from: headFirst.from, to: headLast.to });
  }
  return out;
};

const postprocess = (
  pieces: Piece[],
  grid: Grid,
  x: Float64Array,
  defaults: EffortSignalDefaults,
): Piece[] => {
  let out = bridgeBreaks(merge(pieces));
  for (const piece of out) {
    if (piece.kind === 'work' && movingLength(grid, piece.from, piece.to) < defaults.minWork) {
      piece.kind = 'rest';
    }
  }
  out = merge(fillShortGapsBetweenWork(merge(out)));
  for (const piece of out) {
    if (piece.kind === 'steady' && piece.to - piece.from < EFFORT_MIN_STEADY_S) piece.kind = 'rest';
  }
  const trace = smooth(x, grid.isBreak, EFFORT_EDGE_TRACE_S);
  return markWarmupCooldown(refineEdges(merge(out), x, trace));
};

const labelSegments = (
  segments: Segment[],
  length: number,
  enter: number,
  steady: number,
): Piece[] => {
  const pieces: Piece[] = [];
  let previousEnd = 0;
  for (const segment of segments) {
    if (segment.from > previousEnd) {
      pieces.push({ kind: 'break', from: previousEnd, to: segment.from });
    }
    let kind: BlockKind = 'rest';
    if (segment.mean >= enter) kind = 'work';
    else if (segment.mean >= steady) kind = 'steady';
    pieces.push({ kind, from: segment.from, to: segment.to });
    previousEnd = segment.to;
  }
  if (previousEnd < length) pieces.push({ kind: 'break', from: previousEnd, to: length });
  return pieces;
};

const passesGuards = (pieces: Piece[], grid: Grid, x: Float64Array): boolean => {
  let moving = 0;
  let workSeconds = 0;
  let workSum = 0;
  let workCount = 0;
  let otherSum = 0;
  let otherCount = 0;
  let workBlocks = 0;
  for (const piece of pieces) {
    if (piece.kind === 'break') continue;
    if (piece.kind === 'work') workBlocks++;
    for (let i = piece.from; i < piece.to; i++) {
      if (grid.isBreak[i] === 1) continue;
      moving++;
      if (piece.kind === 'work') workSeconds++;
      const value = x[i];
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
  if (moving === 0 || workSeconds / moving > EFFORT_MAX_WORK_SHARE) return false;
  if (workBlocks < EFFORT_MIN_WORK_BLOCKS) return false;
  if (workCount === 0 || otherCount === 0) return false;
  return workSum / workCount >= EFFORT_MIN_CONTRAST * (otherSum / otherCount);
};

const referenceOf = (
  signal: EffortSignal,
  thresholds: EffortThresholds,
  factor: number,
): number | undefined => {
  if (signal === 'power') {
    if (thresholds.ftp === undefined || thresholds.ftp <= 0) return undefined;
    return factor * thresholds.ftp;
  }
  if (signal === 'pace') {
    if (thresholds.thresholdPace === undefined || thresholds.thresholdPace <= 0) return undefined;
    return factor * (1000 / thresholds.thresholdPace);
  }
  /** @see [Karvonen1957] */
  return thresholds.restHr + factor * (thresholds.maxHr - thresholds.restHr);
};

export const detectEfforts = (
  records: SessionRecord[],
  sport: Sport,
  thresholds: EffortThresholds,
  gradients?: Array<number | undefined>,
): EffortDetection => {
  const empty: EffortDetection = { blocks: [], signal: null, limitedBy: undefined };
  const grid = buildGrid(records);
  if (!grid) return empty;

  let limitedBy: EffortLimiter | undefined = undefined;
  let chosen: EffortSignal | null = null;
  for (const signal of EFFORT_SIGNAL_ORDER[sport]) {
    const probe = signalSeries(grid, signal, () => 1);
    if (coverage(grid, probe) < EFFORT_MIN_COVERAGE) continue;
    if (referenceOf(signal, thresholds, 1) === undefined) {
      limitedBy = EFFORT_SIGNAL_LIMITERS[signal];
      continue;
    }
    chosen = signal;
    break;
  }
  if (chosen === null) return { blocks: [], signal: null, limitedBy };

  const defaults = EFFORT_SIGNAL_DEFAULTS[chosen];
  const enter = referenceOf(chosen, thresholds, defaults.enter);
  const steady = referenceOf(chosen, thresholds, defaults.steady);
  if (enter === undefined || steady === undefined) return { blocks: [], signal: chosen, limitedBy };

  let gradeFactor = (_second: number): number => 1;
  if (chosen === 'pace') {
    const perRecord = gradients ?? windowedGradients(records);
    gradeFactor = (second) => gradeAdjustedPaceFactor(perRecord[grid.record[second] ?? 0] ?? 0);
  }
  const x = signalSeries(grid, chosen, gradeFactor);
  const pieces = postprocess(
    labelSegments(peltSegments(x, grid.isBreak), grid.length, enter, steady),
    grid,
    x,
    defaults,
  );
  if (!passesGuards(pieces, grid, x)) return { blocks: [], signal: chosen, limitedBy };

  const blocks: EffortBlock[] = [];
  for (const piece of pieces) {
    if (piece.kind === 'break') continue;
    let endSecond = piece.to - 1;
    if (piece.to < grid.length && grid.isBreak[piece.to] === 0) endSecond = piece.to;
    blocks.push({
      kind: piece.kind,
      start: grid.offset + piece.from,
      end: grid.offset + piece.to,
      startIndex: grid.record[piece.from] ?? 0,
      endIndex: grid.record[endSecond] ?? 0,
      movingTime: movingLength(grid, piece.from, piece.to),
    });
  }
  return { blocks, signal: chosen, limitedBy };
};
