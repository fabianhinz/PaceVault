// Sources: [Veness2019]
// See packages/engine/SOURCES.md for full citations.

import { detectClimbs } from '@pacevault/engine/climbs.ts';
import {
  degreesToRadians,
  haversineDistanceMeters,
  initialBearingDegrees,
} from '@pacevault/engine/geodesy.ts';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

export type SegmentType = 'climb' | 'flat' | 'descent' | 'route';

export interface SegmentTrackPoint {
  lat: number;
  lng: number;
  distanceMeters: number;
  timestampSec: number;
  elevationMeters: number | undefined;
}

export interface SegmentClimbSpan {
  fromPoint: number;
  toPoint: number;
}

export interface SegmentTrack {
  sessionId: string;
  sport: Sport;
  date: number;
  points: SegmentTrackPoint[];
  climbSpans: SegmentClimbSpan[];
}

export interface SegmentPass {
  sessionId: string;
  startTimestampSec: number;
  endTimestampSec: number;
  durationSec: number;
  splitDurationsSec: number[];
  coverageRatio: number;
}

export interface DetectedSegment {
  sport: Sport;
  type: SegmentType;
  leadSessionId: string;
  startMeters: number;
  endMeters: number;
  distanceMeters: number;
  netElevationMeters: number | null;
  geometry: Array<[number, number]>;
  passes: SegmentPass[];
}

type GpsRecord = SessionRecord & { lat: number; lng: number; distance: number };

interface PlanarPoint extends SegmentTrackPoint {
  xMeters: number;
  yMeters: number;
  bearingDegrees: number;
}

interface PlanarTrack {
  track: SegmentTrack;
  points: PlanarPoint[];
}

interface GridHit {
  trackIndex: number;
  pointIndex: number;
}

type Grid = Map<string, GridHit[]>;

interface PointSpan {
  from: number;
  to: number;
}

interface OpenSpan extends PointSpan {
  ids: Set<string>;
}

export interface SegmentDetectionStats {
  leadsProcessed: number;
  leadsSkippedAsRoute: number;
  turnAnchors: number;
  climbAnchors: number;
  atoms: number;
  corridorMatches: number;
  candidates: number;
  droppedAsDuplicate: number;
  msByPhase: Record<SegmentDetectionPhase, number>;
}

export interface SegmentDetectionResult {
  segments: DetectedSegment[];
  stats: SegmentDetectionStats;
}

interface DetectionContext {
  tracks: PlanarTrack[];
  grid: Grid;
  clockMs: () => number;
  stats: SegmentDetectionStats;
}

interface Candidate {
  segment: DetectedSegment;
  stretch: PlanarPoint[];
  passSessionIds: Set<string>;
}

export const SEGMENT_DETECTION_PHASES = [
  'grid',
  'corridorMatch',
  'anchors',
  'typing',
  'dedupe',
] as const;
export type SegmentDetectionPhase = (typeof SEGMENT_DETECTION_PHASES)[number];

const STEP_METERS = 10;
const CORRIDOR_METERS = 30;
const END_TOLERANCE_METERS = 50;
const MIN_COVERAGE_RATIO = 0.95;
const MAX_BEARING_DIFFERENCE_DEGREES = 60;
const TURN_DEGREES = 60;
const TURN_ARM_POINTS = 3;
const TURN_CUT_AFTER_POINTS = 3;
const JOIN_JACCARD_RATIO = 0.9;
const GRID_CELL_METERS = 50;
const LOOKAHEAD_POINTS = 40;
const START_CLUSTER_GAP_POINTS = 20;
const SAME_STRETCH_LENGTH_RATIO = 0.1;
const OVERLAP_SHARE_RATIO = 0.8;
const TYPE_GRADE_RATIO = 0.025;
const MIN_TRACK_POINTS = 10;
const MIN_PASSES = 2;
const BEARING_ARM_POINTS = 2;
const METERS_PER_DEGREE_LATITUDE = 110540;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111320;
export const SEGMENT_SPLIT_COUNT = 24;
const MIN_SEGMENT_METERS_BY_SPORT: Record<Sport, number> = { running: 300, cycling: 1000 };
const NO_CLOCK_MS = (): number => 0;

const interpolate = ({ from, to, fraction }: { from: number; to: number; fraction: number }) =>
  from + (to - from) * fraction;

const interpolateOptional = ({
  from,
  to,
  fraction,
}: {
  from: number | undefined;
  to: number | undefined;
  fraction: number;
}): number | undefined => {
  if (from === undefined || to === undefined) return undefined;
  return interpolate({ from, to, fraction });
};

const isGpsRecord = (record: SessionRecord): record is GpsRecord =>
  record.lat !== undefined && record.lng !== undefined && record.distance !== undefined;

const pointBetween = ({
  previous,
  current,
  distanceMeters,
}: {
  previous: GpsRecord;
  current: GpsRecord;
  distanceMeters: number;
}): SegmentTrackPoint => {
  const fraction = (distanceMeters - previous.distance) / (current.distance - previous.distance);
  return {
    lat: interpolate({ from: previous.lat, to: current.lat, fraction }),
    lng: interpolate({ from: previous.lng, to: current.lng, fraction }),
    distanceMeters,
    timestampSec: interpolate({ from: previous.timestamp, to: current.timestamp, fraction }),
    elevationMeters: interpolateOptional({
      from: previous.elevation,
      to: current.elevation,
      fraction,
    }),
  };
};

const resampledPoints = (records: GpsRecord[]): SegmentTrackPoint[] => {
  const points: SegmentTrackPoint[] = [];
  let nextMeters = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (previous === undefined || current === undefined) continue;
    if (current.distance <= previous.distance) continue;
    for (; nextMeters <= current.distance; nextMeters += STEP_METERS) {
      if (nextMeters < previous.distance) continue;
      points.push(pointBetween({ previous, current, distanceMeters: nextMeters }));
    }
  }
  return points;
};

const pointIndexAtMeters = ({
  points,
  meters,
}: {
  points: SegmentTrackPoint[];
  meters: number | undefined;
}): number | undefined => {
  const first = points[0];
  if (meters === undefined || first === undefined) return undefined;
  const index = Math.round((meters - first.distanceMeters) / STEP_METERS);
  return Math.max(0, Math.min(points.length - 1, index));
};

const climbSpansOf = ({
  sport,
  records,
  points,
}: {
  sport: Sport;
  records: GpsRecord[];
  points: SegmentTrackPoint[];
}): SegmentClimbSpan[] => {
  const climbs = detectClimbs({ sport, records, gradients: windowedGradients(records) });
  const spans: SegmentClimbSpan[] = [];
  for (const climb of climbs) {
    const fromPoint = pointIndexAtMeters({ points, meters: records[climb.startIndex]?.distance });
    const toPoint = pointIndexAtMeters({ points, meters: records[climb.endIndex]?.distance });
    if (fromPoint === undefined || toPoint === undefined || toPoint <= fromPoint) continue;
    spans.push({ fromPoint, toPoint });
  }
  return spans;
};

const projected = ({
  point,
  metersPerDegreeLongitude,
}: {
  point: SegmentTrackPoint;
  metersPerDegreeLongitude: number;
}): PlanarPoint => ({
  ...point,
  xMeters: point.lng * metersPerDegreeLongitude,
  yMeters: point.lat * METERS_PER_DEGREE_LATITUDE,
  bearingDegrees: 0,
});

const planarDistanceMeters = (from: PlanarPoint, to: PlanarPoint): number =>
  Math.hypot(from.xMeters - to.xMeters, from.yMeters - to.yMeters);

const bearingDifferenceDegrees = (from: number, to: number): number => {
  const difference = Math.abs(from - to) % 360;
  if (difference > 180) return 360 - difference;
  return difference;
};

const withBearings = (points: PlanarPoint[]): PlanarPoint[] => {
  points.forEach((point, i) => {
    const from = points[Math.max(0, i - BEARING_ARM_POINTS)];
    const to = points[Math.min(points.length - 1, i + BEARING_ARM_POINTS)];
    if (from === undefined || to === undefined) return;
    const radians = Math.atan2(to.xMeters - from.xMeters, to.yMeters - from.yMeters);
    point.bearingDegrees = ((radians * 180) / Math.PI + 360) % 360;
  });
  return points;
};

// An equirectangular projection around the first point is accurate to well under the corridor width at the size of one person's riding area.
const planarTracks = (tracks: SegmentTrack[]): PlanarTrack[] => {
  const referenceLatitude = tracks[0]?.points[0]?.lat ?? 0;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos(degreesToRadians(referenceLatitude));
  return tracks.map((track) => ({
    track,
    points: withBearings(
      track.points.map((point) => projected({ point, metersPerDegreeLongitude })),
    ),
  }));
};

const cellKey = ({ cellX, cellY }: { cellX: number; cellY: number }): string => `${cellX},${cellY}`;

const cellOf = (point: PlanarPoint): { cellX: number; cellY: number } => ({
  cellX: Math.floor(point.xMeters / GRID_CELL_METERS),
  cellY: Math.floor(point.yMeters / GRID_CELL_METERS),
});

const gridOf = (tracks: PlanarTrack[]): Grid => {
  const grid: Grid = new Map();
  tracks.forEach((track, trackIndex) => {
    track.points.forEach((point, pointIndex) => {
      const key = cellKey(cellOf(point));
      const hits = grid.get(key) ?? [];
      hits.push({ trackIndex, pointIndex });
      grid.set(key, hits);
    });
  });
  return grid;
};

const neighbourKeys = (point: PlanarPoint): string[] => {
  const cell = cellOf(point);
  const keys: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++)
      keys.push(cellKey({ cellX: cell.cellX + dx, cellY: cell.cellY + dy }));
  }
  return keys;
};

const sameWay = ({
  candidate,
  target,
  toleranceMeters,
}: {
  candidate: PlanarPoint;
  target: PlanarPoint;
  toleranceMeters: number;
}): boolean =>
  planarDistanceMeters(candidate, target) <= toleranceMeters &&
  bearingDifferenceDegrees(candidate.bearingDegrees, target.bearingDegrees) <=
    MAX_BEARING_DIFFERENCE_DEGREES;

const pointIndicesNear = ({
  grid,
  tracks,
  point,
}: {
  grid: Grid;
  tracks: PlanarTrack[];
  point: PlanarPoint;
}): Map<number, number[]> => {
  const indicesByTrack = new Map<number, number[]>();
  for (const key of neighbourKeys(point)) {
    for (const hit of grid.get(key) ?? []) {
      const candidate = tracks[hit.trackIndex]?.points[hit.pointIndex];
      if (candidate === undefined) continue;
      if (!sameWay({ candidate, target: point, toleranceMeters: END_TOLERANCE_METERS })) continue;
      const indices = indicesByTrack.get(hit.trackIndex) ?? [];
      indices.push(hit.pointIndex);
      indicesByTrack.set(hit.trackIndex, indices);
    }
  }
  return indicesByTrack;
};

const closestIndex = ({
  indices,
  track,
  target,
}: {
  indices: number[];
  track: PlanarTrack;
  target: PlanarPoint;
}): number | undefined => {
  let best: { index: number; distanceMeters: number } | undefined = undefined;
  for (const index of indices) {
    const point = track.points[index];
    if (point === undefined) continue;
    const distanceMeters = planarDistanceMeters(point, target);
    if (best === undefined || distanceMeters < best.distanceMeters)
      best = { index, distanceMeters };
  }
  return best?.index;
};

// A track that passes the start more than once gets one candidate start per visit.
const startPerVisit = ({
  indices,
  track,
  target,
}: {
  indices: number[];
  track: PlanarTrack;
  target: PlanarPoint;
}): number[] => {
  const visits: number[][] = [];
  for (const index of [...indices].sort((a, b) => a - b)) {
    const visit = visits[visits.length - 1];
    const last = visit?.[visit.length - 1];
    if (visit === undefined || last === undefined || index - last > START_CLUSTER_GAP_POINTS) {
      visits.push([index]);
      continue;
    }
    visit.push(index);
  }
  return visits.flatMap((visit) => {
    const index = closestIndex({ indices: visit, track, target });
    if (index === undefined) return [];
    return [index];
  });
};

const timestampAtProjection = ({
  track,
  index,
  target,
}: {
  track: PlanarTrack;
  index: number;
  target: PlanarPoint;
}): number | undefined => {
  const point = track.points[index];
  if (point === undefined) return undefined;
  let best = {
    timestampSec: point.timestampSec,
    distanceMeters: planarDistanceMeters(point, target),
  };
  for (const neighbour of [track.points[index - 1], track.points[index + 1]]) {
    if (neighbour === undefined) continue;
    const dx = neighbour.xMeters - point.xMeters;
    const dy = neighbour.yMeters - point.yMeters;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) continue;
    const along =
      ((target.xMeters - point.xMeters) * dx + (target.yMeters - point.yMeters) * dy) /
      lengthSquared;
    const fraction = Math.max(0, Math.min(1, along));
    const distanceMeters = Math.hypot(
      point.xMeters + dx * fraction - target.xMeters,
      point.yMeters + dy * fraction - target.yMeters,
    );
    if (distanceMeters >= best.distanceMeters) continue;
    best = {
      timestampSec: interpolate({ from: point.timestampSec, to: neighbour.timestampSec, fraction }),
      distanceMeters,
    };
  }
  return best.timestampSec;
};

const lookaheadMatch = ({
  track,
  index,
  target,
}: {
  track: PlanarTrack;
  index: number;
  target: PlanarPoint;
}): { index: number; covered: boolean } => {
  let best = { index, distanceMeters: Number.POSITIVE_INFINITY };
  for (let look = index + 1; look <= index + LOOKAHEAD_POINTS; look++) {
    const candidate = track.points[look];
    if (candidate === undefined) break;
    const distanceMeters = planarDistanceMeters(candidate, target);
    if (distanceMeters < best.distanceMeters) best = { index: look, distanceMeters };
  }
  if (best.distanceMeters <= CORRIDOR_METERS) return { index: best.index, covered: true };
  return { index, covered: false };
};

const advancedMatch = ({
  track,
  index,
  target,
}: {
  track: PlanarTrack;
  index: number;
  target: PlanarPoint;
}): { index: number; covered: boolean } => {
  let current = index;
  for (;;) {
    const here = track.points[current];
    const ahead = track.points[current + 1];
    if (here === undefined || ahead === undefined) break;
    if (planarDistanceMeters(ahead, target) > planarDistanceMeters(here, target)) break;
    current += 1;
  }
  const here = track.points[current];
  if (here !== undefined && planarDistanceMeters(here, target) <= CORRIDOR_METERS) {
    return { index: current, covered: true };
  }
  return lookaheadMatch({ track, index: current, target });
};

const walkAlong = ({
  stretch,
  track,
  start,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  start: number;
}): { endIndex: number; coverageRatio: number; timestampsSec: number[] } => {
  let index = start;
  let coveredPoints = 0;
  const timestampsSec: number[] = [];
  for (const target of stretch) {
    const step = advancedMatch({ track, index, target });
    index = step.index;
    if (step.covered) coveredPoints += 1;
    const point = track.points[index];
    if (point !== undefined) timestampsSec.push(point.timestampSec);
  }
  return { endIndex: index, coverageRatio: coveredPoints / stretch.length, timestampsSec };
};

const splitDurations = ({
  timestampsSec,
  startTimestampSec,
  durationSec,
}: {
  timestampsSec: number[];
  startTimestampSec: number;
  durationSec: number;
}): number[] =>
  Array.from({ length: SEGMENT_SPLIT_COUNT + 1 }, (_, split) => {
    if (split === 0) return 0;
    if (split === SEGMENT_SPLIT_COUNT) return durationSec;
    const index = Math.round((split / SEGMENT_SPLIT_COUNT) * (timestampsSec.length - 1));
    const timestampSec = timestampsSec[index];
    if (timestampSec === undefined) return 0;
    return Math.min(durationSec, Math.max(0, timestampSec - startTimestampSec));
  });

const passFrom = ({
  stretch,
  track,
  start,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  start: number;
}): SegmentPass | undefined => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return undefined;
  const walk = walkAlong({ stretch, track, start });
  const endPoint = track.points[walk.endIndex];
  if (endPoint === undefined || planarDistanceMeters(endPoint, last) > END_TOLERANCE_METERS)
    return undefined;
  if (walk.coverageRatio < MIN_COVERAGE_RATIO) return undefined;
  const startTimestampSec = timestampAtProjection({ track, index: start, target: first });
  const endTimestampSec = timestampAtProjection({ track, index: walk.endIndex, target: last });
  if (startTimestampSec === undefined || endTimestampSec === undefined) return undefined;
  const durationSec = endTimestampSec - startTimestampSec;
  if (durationSec <= 0) return undefined;
  return {
    sessionId: track.track.sessionId,
    startTimestampSec,
    endTimestampSec,
    durationSec,
    splitDurationsSec: splitDurations({
      timestampsSec: walk.timestampsSec,
      startTimestampSec,
      durationSec,
    }),
    coverageRatio: walk.coverageRatio,
  };
};

const fastestPassOn = ({
  stretch,
  track,
  startIndices,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  startIndices: number[];
}): SegmentPass | undefined => {
  const first = stretch[0];
  if (first === undefined) return undefined;
  let fastest: SegmentPass | undefined = undefined;
  for (const start of startPerVisit({ indices: startIndices, track, target: first })) {
    const pass = passFrom({ stretch, track, start });
    if (pass === undefined) continue;
    if (fastest === undefined || pass.durationSec < fastest.durationSec) fastest = pass;
  }
  return fastest;
};

const timed = <T>({
  context,
  phase,
  run,
}: {
  context: DetectionContext;
  phase: SegmentDetectionPhase;
  run: () => T;
}): T => {
  const startMs = context.clockMs();
  const result = run();
  context.stats.msByPhase[phase] += context.clockMs() - startMs;
  return result;
};

const matchedPasses = ({
  stretch,
  context,
}: {
  stretch: PlanarPoint[];
  context: DetectionContext;
}): SegmentPass[] => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return [];
  const tracks = context.tracks;
  const atEnd = pointIndicesNear({ grid: context.grid, tracks, point: last });
  const passes: SegmentPass[] = [];
  for (const [trackIndex, startIndices] of pointIndicesNear({
    grid: context.grid,
    tracks,
    point: first,
  })) {
    const track = tracks[trackIndex];
    if (track === undefined || !atEnd.has(trackIndex)) continue;
    const pass = fastestPassOn({ stretch, track, startIndices });
    if (pass !== undefined) passes.push(pass);
  }
  return passes;
};

const passesAlong = ({
  stretch,
  context,
}: {
  stretch: PlanarPoint[];
  context: DetectionContext;
}): SegmentPass[] => {
  context.stats.corridorMatches += 1;
  return timed({ context, phase: 'corridorMatch', run: () => matchedPasses({ stretch, context }) });
};

const turnAnchors = (track: PlanarTrack): number[] => {
  const anchors: number[] = [];
  let sharpest: { index: number; angleDegrees: number } | undefined = undefined;
  for (let i = TURN_ARM_POINTS; i < track.points.length - TURN_ARM_POINTS; i++) {
    const before = track.points[i - TURN_ARM_POINTS];
    const here = track.points[i];
    const after = track.points[i + TURN_ARM_POINTS];
    if (before === undefined || here === undefined || after === undefined) continue;
    const angleDegrees = bearingDifferenceDegrees(
      initialBearingDegrees({ from: before, to: here }),
      initialBearingDegrees({ from: here, to: after }),
    );
    if (angleDegrees >= TURN_DEGREES) {
      if (sharpest === undefined || angleDegrees > sharpest.angleDegrees)
        sharpest = { index: i, angleDegrees };
      continue;
    }
    if (sharpest !== undefined) anchors.push(sharpest.index + TURN_CUT_AFTER_POINTS);
    sharpest = undefined;
  }
  return anchors;
};

const spanLength = ({ boundaries, index }: { boundaries: number[]; index: number }): number => {
  const from = boundaries[index];
  const to = boundaries[index + 1];
  if (from === undefined || to === undefined) return Number.POSITIVE_INFINITY;
  return to - from;
};

const shortestSpanIndex = (boundaries: number[]): number => {
  let shortest = 0;
  for (let i = 1; i < boundaries.length - 1; i++) {
    if (spanLength({ boundaries, index: i }) < spanLength({ boundaries, index: shortest }))
      shortest = i;
  }
  return shortest;
};

// A span below the sport's minimum length joins its shorter neighbour.
const atomBoundaries = ({
  pointCount,
  anchors,
  minPoints,
}: {
  pointCount: number;
  anchors: number[];
  minPoints: number;
}): number[] => {
  const last = pointCount - 1;
  const inner = anchors.filter((anchor) => anchor > 0 && anchor < last);
  const boundaries = [...new Set([0, ...inner, last])].sort((a, b) => a - b);
  while (boundaries.length > 2) {
    const shortest = shortestSpanIndex(boundaries);
    if (spanLength({ boundaries, index: shortest }) >= minPoints) break;
    const leftLength = spanLength({ boundaries, index: shortest - 1 });
    const rightLength = spanLength({ boundaries, index: shortest + 1 });
    if (leftLength <= rightLength) boundaries.splice(shortest, 1);
    else boundaries.splice(shortest + 1, 1);
  }
  return boundaries;
};

const jaccardRatio = (first: Set<string>, second: Set<string>): number => {
  let shared = 0;
  for (const id of first) if (second.has(id)) shared += 1;
  const union = first.size + second.size - shared;
  if (union === 0) return 0;
  return shared / union;
};

const netElevationMeters = (stretch: PlanarPoint[]): number | null => {
  const first = stretch.find((point) => point.elevationMeters !== undefined)?.elevationMeters;
  const last = stretch.findLast((point) => point.elevationMeters !== undefined)?.elevationMeters;
  if (first === undefined || last === undefined) return null;
  return last - first;
};

const segmentTypeOf = ({
  span,
  climbSpans,
  stretch,
}: {
  span: PointSpan;
  climbSpans: SegmentClimbSpan[];
  stretch: PlanarPoint[];
}): SegmentType => {
  const lengthPoints = span.to - span.from;
  let pointsInClimb = 0;
  for (const climb of climbSpans) {
    pointsInClimb += Math.max(
      0,
      Math.min(span.to, climb.toPoint) - Math.max(span.from, climb.fromPoint),
    );
  }
  if (pointsInClimb >= lengthPoints / 2) return 'climb';
  const elevationMeters = netElevationMeters(stretch);
  if (elevationMeters === null) return 'flat';
  const gradeRatio = elevationMeters / Math.max(STEP_METERS, lengthPoints * STEP_METERS);
  if (gradeRatio >= TYPE_GRADE_RATIO) return 'climb';
  if (gradeRatio <= -TYPE_GRADE_RATIO) return 'descent';
  return 'flat';
};

const stretchLengthMeters = (stretch: PlanarPoint[]): number => {
  let totalMeters = 0;
  for (let i = 1; i < stretch.length; i++) {
    const from = stretch[i - 1];
    const to = stretch[i];
    if (from !== undefined && to !== undefined)
      totalMeters += haversineDistanceMeters({ from, to });
  }
  return totalMeters;
};

const sameStretch = (first: PlanarPoint[], second: PlanarPoint[]): boolean => {
  const firstStart = first[0];
  const firstEnd = first[first.length - 1];
  const secondStart = second[0];
  const secondEnd = second[second.length - 1];
  if (firstStart === undefined || firstEnd === undefined) return false;
  if (secondStart === undefined || secondEnd === undefined) return false;
  const longer = Math.max(first.length, second.length);
  if (Math.abs(first.length - second.length) > SAME_STRETCH_LENGTH_RATIO * longer) return false;
  return (
    planarDistanceMeters(firstStart, secondStart) <= END_TOLERANCE_METERS &&
    planarDistanceMeters(firstEnd, secondEnd) <= END_TOLERANCE_METERS
  );
};

const overlapShareRatio = ({
  stretch,
  other,
}: {
  stretch: PlanarPoint[];
  other: PlanarPoint[];
}): number => {
  const cells = new Map<string, PlanarPoint[]>();
  for (const point of other) {
    const key = cellKey(cellOf(point));
    const points = cells.get(key) ?? [];
    points.push(point);
    cells.set(key, points);
  }
  const inside = stretch.filter((point) =>
    neighbourKeys(point).some((key) =>
      (cells.get(key) ?? []).some((candidate) =>
        sameWay({ candidate, target: point, toleranceMeters: CORRIDOR_METERS }),
      ),
    ),
  );
  return inside.length / Math.max(1, stretch.length);
};

// Anchors come from each lead, so one shared stretch is found once per lead with shifted cuts.
const duplicateOf = ({ existing, next }: { existing: Candidate; next: Candidate }): boolean => {
  if (sameStretch(existing.stretch, next.stretch)) return true;
  if (jaccardRatio(existing.passSessionIds, next.passSessionIds) < JOIN_JACCARD_RATIO) return false;
  return (
    overlapShareRatio({ stretch: next.stretch, other: existing.stretch }) >= OVERLAP_SHARE_RATIO &&
    overlapShareRatio({ stretch: existing.stretch, other: next.stretch }) >= OVERLAP_SHARE_RATIO
  );
};

const joinsOpenSpan = ({ open, ids }: { open: OpenSpan | undefined; ids: Set<string> }): boolean =>
  open !== undefined && ids.size >= MIN_PASSES && jaccardRatio(open.ids, ids) >= JOIN_JACCARD_RATIO;

const joinedSpans = ({
  boundaries,
  atomPassIds,
}: {
  boundaries: number[];
  atomPassIds: Array<Set<string>>;
}): PointSpan[] => {
  const spans: OpenSpan[] = [];
  let open: OpenSpan | undefined = undefined;
  for (const [i, ids] of atomPassIds.entries()) {
    const from = boundaries[i];
    const to = boundaries[i + 1];
    if (from === undefined || to === undefined) continue;
    if (open !== undefined && joinsOpenSpan({ open, ids })) {
      open.to = to;
      continue;
    }
    open = undefined;
    if (ids.size < MIN_PASSES) continue;
    open = { from, to, ids };
    spans.push(open);
  }
  return spans.map((span) => ({ from: span.from, to: span.to }));
};

const candidateOf = ({
  lead,
  span,
  type,
  passes,
}: {
  lead: PlanarTrack;
  span: PointSpan;
  type: SegmentType;
  passes: SegmentPass[];
}): Candidate => {
  const stretch = lead.points.slice(span.from, span.to + 1);
  return {
    stretch,
    passSessionIds: new Set(passes.map((pass) => pass.sessionId)),
    segment: {
      sport: lead.track.sport,
      type,
      leadSessionId: lead.track.sessionId,
      startMeters: stretch[0]?.distanceMeters ?? 0,
      endMeters: stretch[stretch.length - 1]?.distanceMeters ?? 0,
      distanceMeters: stretchLengthMeters(stretch),
      netElevationMeters: netElevationMeters(stretch),
      geometry: stretch.map((point) => [point.lat, point.lng]),
      passes,
    },
  };
};

const leadBoundaries = ({
  lead,
  context,
  minPoints,
}: {
  lead: PlanarTrack;
  context: DetectionContext;
  minPoints: number;
}): number[] => {
  const turns = turnAnchors(lead);
  const climbAnchors = lead.track.climbSpans.flatMap((climb) => [climb.fromPoint, climb.toPoint]);
  context.stats.turnAnchors += turns.length;
  context.stats.climbAnchors += climbAnchors.length;
  return atomBoundaries({
    pointCount: lead.points.length,
    anchors: [...turns, ...climbAnchors],
    minPoints,
  });
};

const leadSpans = ({
  lead,
  context,
}: {
  lead: PlanarTrack;
  context: DetectionContext;
}): PointSpan[] => {
  const minPoints = MIN_SEGMENT_METERS_BY_SPORT[lead.track.sport] / STEP_METERS;
  const boundaries = timed({
    context,
    phase: 'anchors',
    run: () => leadBoundaries({ lead, context, minPoints }),
  });
  context.stats.atoms += boundaries.length - 1;
  const atomPassIds = boundaries.slice(0, -1).map((from, i) => {
    const stretch = lead.points.slice(from, (boundaries[i + 1] ?? from) + 1);
    return new Set(passesAlong({ stretch, context }).map((pass) => pass.sessionId));
  });
  return timed({
    context,
    phase: 'anchors',
    run: () =>
      joinedSpans({ boundaries, atomPassIds }).filter((span) => span.to - span.from >= minPoints),
  });
};

const typedCandidate = ({
  lead,
  span,
  passes,
  context,
}: {
  lead: PlanarTrack;
  span: PointSpan;
  passes: SegmentPass[];
  context: DetectionContext;
}): Candidate =>
  timed({
    context,
    phase: 'typing',
    run: () => {
      const stretch = lead.points.slice(span.from, span.to + 1);
      const type = segmentTypeOf({ span, climbSpans: lead.track.climbSpans, stretch });
      return candidateOf({ lead, span, type, passes });
    },
  });

const leadCandidates = ({
  lead,
  context,
}: {
  lead: PlanarTrack;
  context: DetectionContext;
}): Candidate[] => {
  const candidates: Candidate[] = [];
  const lastPoint = lead.points.length - 1;
  const routePasses = passesAlong({ stretch: lead.points, context });
  const hasRoute = routePasses.length >= MIN_PASSES;
  if (hasRoute) {
    const span = { from: 0, to: lastPoint };
    candidates.push(
      timed({
        context,
        phase: 'typing',
        run: () => candidateOf({ lead, span, type: 'route', passes: routePasses }),
      }),
    );
  }
  for (const span of leadSpans({ lead, context })) {
    if (hasRoute && span.to - span.from >= MIN_COVERAGE_RATIO * lastPoint) continue;
    const passes = passesAlong({ stretch: lead.points.slice(span.from, span.to + 1), context });
    if (passes.length < MIN_PASSES) continue;
    candidates.push(typedCandidate({ lead, span, passes, context }));
  }
  context.stats.candidates += candidates.length;
  return candidates;
};

const leadAlreadyRoute = ({
  lead,
  accepted,
}: {
  lead: PlanarTrack;
  accepted: Candidate[];
}): boolean =>
  accepted.some(
    (existing) =>
      existing.segment.type === 'route' &&
      existing.passSessionIds.has(lead.track.sessionId) &&
      Math.abs(existing.stretch.length - lead.points.length) <=
        SAME_STRETCH_LENGTH_RATIO * lead.points.length,
  );

export const segmentTrack = ({
  sessionId,
  sport,
  date,
  records,
}: {
  sessionId: string;
  sport: Sport;
  date: number;
  records: SessionRecord[];
}): SegmentTrack | undefined => {
  const gpsRecords = records.filter(isGpsRecord);
  const points = resampledPoints(gpsRecords);
  if (points.length < MIN_TRACK_POINTS) return undefined;
  return {
    sessionId,
    sport,
    date,
    points,
    climbSpans: climbSpansOf({ sport, records: gpsRecords, points }),
  };
};

const emptyStats = (): SegmentDetectionStats => ({
  leadsProcessed: 0,
  leadsSkippedAsRoute: 0,
  turnAnchors: 0,
  climbAnchors: 0,
  atoms: 0,
  corridorMatches: 0,
  candidates: 0,
  droppedAsDuplicate: 0,
  msByPhase: { grid: 0, corridorMatch: 0, anchors: 0, typing: 0, dedupe: 0 },
});

const acceptUnique = ({
  next,
  accepted,
  context,
}: {
  next: Candidate;
  accepted: Candidate[];
  context: DetectionContext;
}): void => {
  const duplicate = timed({
    context,
    phase: 'dedupe',
    run: () => accepted.some((existing) => duplicateOf({ existing, next })),
  });
  if (duplicate) {
    context.stats.droppedAsDuplicate += 1;
    return;
  }
  accepted.push(next);
};

export const segmentDetectionResult = ({
  sport,
  tracks,
  clockMs = NO_CLOCK_MS,
}: {
  sport: Sport;
  tracks: SegmentTrack[];
  clockMs?: () => number;
}): SegmentDetectionResult => {
  const stats = emptyStats();
  const gridStartMs = clockMs();
  const ownTracks = tracks.filter((track) => track.sport === sport).sort((a, b) => b.date - a.date);
  const planar = planarTracks(ownTracks);
  const context: DetectionContext = { tracks: planar, grid: gridOf(planar), clockMs, stats };
  stats.msByPhase.grid = clockMs() - gridStartMs;
  const accepted: Candidate[] = [];
  for (const lead of planar) {
    if (leadAlreadyRoute({ lead, accepted })) {
      stats.leadsSkippedAsRoute += 1;
      continue;
    }
    stats.leadsProcessed += 1;
    for (const next of leadCandidates({ lead, context })) acceptUnique({ next, accepted, context });
  }
  return { segments: accepted.map((candidate) => candidate.segment), stats };
};

export const detectedSegments = ({
  sport,
  tracks,
}: {
  sport: Sport;
  tracks: SegmentTrack[];
}): DetectedSegment[] => segmentDetectionResult({ sport, tracks }).segments;
