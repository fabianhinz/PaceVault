import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';

export const SCATTER_WINDOW_PASSES = 10;
const ROLLING_MEDIAN_PASSES = 5;

export const bestPassOf = (segment: Segment): StoredSegmentPass | undefined => {
  let best: StoredSegmentPass | undefined = undefined;
  for (const pass of segment.passes) {
    if (best === undefined || pass.durationSec < best.durationSec) best = pass;
  }
  return best;
};

export const latestPassOf = (segment: Segment): StoredSegmentPass | undefined => {
  let latest: StoredSegmentPass | undefined = undefined;
  for (const pass of segment.passes) {
    if (latest === undefined || pass.date > latest.date) latest = pass;
  }
  return latest;
};

export const passesFastestFirst = (segment: Segment): StoredSegmentPass[] =>
  [...segment.passes].sort((a, b) => a.durationSec - b.durationSec);

export const passesByDate = (segment: Segment): StoredSegmentPass[] =>
  [...segment.passes].sort((a, b) => a.date - b.date);

const median = (values: number[]): number | null => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  if (upper === undefined) return null;
  if (sorted.length % 2 === 1) return upper;
  const lower = sorted[middle - 1];
  if (lower === undefined) return upper;
  return (lower + upper) / 2;
};

export const rollingMedianSec = (passesInDateOrder: StoredSegmentPass[]): Array<number | null> =>
  passesInDateOrder.map((_, i) =>
    median(
      passesInDateOrder
        .slice(Math.max(0, i - ROLLING_MEDIAN_PASSES + 1), i + 1)
        .map((pass) => pass.durationSec),
    ),
  );

export const passRank = ({
  segment,
  sessionId,
}: {
  segment: Segment;
  sessionId: string;
}): number | undefined => {
  const pass = segment.passes.find((candidate) => candidate.sessionId === sessionId);
  if (pass === undefined) return undefined;
  return 1 + segment.passes.filter((other) => other.durationSec < pass.durationSec).length;
};

export const latestWindowSessionIds = (segment: Segment): Set<string> | null => {
  if (segment.passes.length <= SCATTER_WINDOW_PASSES) return null;
  return new Set(
    passesByDate(segment)
      .slice(-SCATTER_WINDOW_PASSES)
      .map((pass) => pass.sessionId),
  );
};

export const gapSeriesSec = ({
  pass,
  best,
}: {
  pass: StoredSegmentPass;
  best: StoredSegmentPass;
}): number[] =>
  pass.splitDurationsSec.flatMap((splitSec, i) => {
    const bestSplitSec = best.splitDurationsSec[i];
    if (bestSplitSec === undefined) return [];
    return [bestSplitSec - splitSec];
  });

const distanceFractionAt = ({
  pass,
  elapsedSec,
}: {
  pass: StoredSegmentPass;
  elapsedSec: number;
}): number => {
  const splits = pass.splitDurationsSec;
  const lastSplit = splits.length - 1;
  if (lastSplit < 1 || elapsedSec >= pass.durationSec) return 1;
  for (let i = 0; i < lastSplit; i++) {
    const from = splits[i];
    const to = splits[i + 1];
    if (from === undefined || to === undefined || elapsedSec > to) continue;
    let within = 0;
    if (to > from) within = (elapsedSec - from) / (to - from);
    return (i + Math.max(0, within)) / lastSplit;
  }
  return 1;
};

const pointAlong = ({
  geometry,
  fraction,
}: {
  geometry: Array<[number, number]>;
  fraction: number;
}): [number, number] | null => {
  const legs: number[] = [];
  for (let i = 1; i < geometry.length; i++) {
    const from = geometry[i - 1];
    const to = geometry[i];
    if (from === undefined || to === undefined) continue;
    legs.push(
      haversineDistanceMeters({
        from: { lat: from[0], lng: from[1] },
        to: { lat: to[0], lng: to[1] },
      }),
    );
  }
  let remainingMeters = fraction * legs.reduce((total, leg) => total + leg, 0);
  for (const [i, legMeters] of legs.entries()) {
    const from = geometry[i];
    const to = geometry[i + 1];
    if (from === undefined || to === undefined) continue;
    if (remainingMeters <= legMeters && legMeters > 0) {
      const within = remainingMeters / legMeters;
      return [from[0] + (to[0] - from[0]) * within, from[1] + (to[1] - from[1]) * within];
    }
    remainingMeters -= legMeters;
  }
  return geometry[geometry.length - 1] ?? null;
};

export const passPositionAt = ({
  segment,
  pass,
  elapsedSec,
}: {
  segment: Segment;
  pass: StoredSegmentPass;
  elapsedSec: number;
}): [number, number] | null =>
  pointAlong({ geometry: segment.geometry, fraction: distanceFractionAt({ pass, elapsedSec }) });

export interface SessionSegment {
  segment: Segment;
  pass: StoredSegmentPass;
  rank: number;
}

export const sessionSegmentsInRideOrder = ({
  segments,
  sessionId,
}: {
  segments: Segment[];
  sessionId: string;
}): SessionSegment[] =>
  segments
    .flatMap((segment) => {
      const pass = segment.passes.find((candidate) => candidate.sessionId === sessionId);
      const rank = passRank({ segment, sessionId });
      if (pass === undefined || rank === undefined) return [];
      return [{ segment, pass, rank }];
    })
    .sort((a, b) => a.pass.startTimestampSec - b.pass.startTimestampSec);
