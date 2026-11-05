import type { Segment } from '@/store/segments.ts';
import type { SegmentPassesEntry, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';
import type { PlotStripPosition } from '@pacevault/ui/components/pvPlotStrip/types.ts';
import type { MatchedSegment } from './types.ts';

const ROBUST_SCALE_QUANTILE = 0.9;
const MIN_SCALE_SPAN_SEC = 1;

export const bestPassOf = (segment: MatchedSegment): StoredSegmentPass | undefined => {
  let best: StoredSegmentPass | undefined = undefined;
  for (const pass of segment.passes) {
    if (best === undefined || pass.durationSec < best.durationSec) best = pass;
  }
  return best;
};

export const latestPassOf = (segment: MatchedSegment): StoredSegmentPass | undefined => {
  let latest: StoredSegmentPass | undefined = undefined;
  for (const pass of segment.passes) {
    if (latest === undefined || pass.date > latest.date) latest = pass;
  }
  return latest;
};

export interface PassYear {
  year: number;
  passes: StoredSegmentPass[];
}

export const passesByYear = (passes: StoredSegmentPass[]): PassYear[] => {
  const years: PassYear[] = [];
  for (const pass of [...passes].sort((a, b) => a.date - b.date)) {
    const year = new Date(pass.date).getFullYear();
    const current = years.at(-1);
    if (current?.year === year) current.passes.push(pass);
    else years.push({ year, passes: [pass] });
  }
  return years;
};

export const passDotScale = (
  passes: StoredSegmentPass[],
): ((durationSec: number) => PlotStripPosition) => {
  const sortedSec = passes.map((pass) => pass.durationSec).sort((a, b) => a - b);
  const fastestSec = sortedSec[0];
  const slowEdgeSec = sortedSec[Math.floor(ROBUST_SCALE_QUANTILE * (sortedSec.length - 1))];
  if (fastestSec === undefined || slowEdgeSec === undefined)
    return () => ({ ratio: 0, clamped: false });
  const spanSec = Math.max(MIN_SCALE_SPAN_SEC, slowEdgeSec - fastestSec);
  return (durationSec) => {
    const ratio = (durationSec - fastestSec) / spanSec;
    return { ratio: Math.min(1, ratio), clamped: ratio > 1 };
  };
};

export const passRank = ({
  segment,
  sessionId,
}: {
  segment: MatchedSegment;
  sessionId: string;
}): number | undefined => {
  const pass = segment.passes.find((candidate) => candidate.sessionId === sessionId);
  if (pass === undefined) return undefined;
  return 1 + segment.passes.filter((other) => other.durationSec < pass.durationSec).length;
};

export interface SessionSegment {
  segment: MatchedSegment;
  pass: StoredSegmentPass;
  rank: number;
}

export const sessionSegmentsInRideOrder = ({
  segments,
  sessionId,
}: {
  segments: MatchedSegment[];
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

const lastPassDateOf = (passes: StoredSegmentPass[]): number | null => {
  let last: number | null = null;
  for (const pass of passes) {
    if (last === null || pass.date > last) last = pass.date;
  }
  return last;
};

export const unmatchedSegment = (segment: Segment): MatchedSegment => ({
  ...segment,
  geometry: decodeTrackForRendering(segment.encodedPolyline).map((point): [number, number] => [
    point[1],
    point[0],
  ]),
  passes: [],
  lastPassDate: null,
});

export const matchedSegment = ({
  segment,
  entry,
}: {
  segment: Segment;
  entry: SegmentPassesEntry;
}): MatchedSegment => ({
  ...unmatchedSegment(segment),
  passes: entry.passes,
  lastPassDate: lastPassDateOf(entry.passes),
});

export const withPasses = ({
  segment,
  passes,
}: {
  segment: MatchedSegment;
  passes: StoredSegmentPass[];
}): MatchedSegment => ({ ...segment, passes, lastPassDate: lastPassDateOf(passes) });

export const byLastRidden = (a: MatchedSegment, b: MatchedSegment): number =>
  (b.lastPassDate ?? b.createdAt) - (a.lastPassDate ?? a.createdAt);
