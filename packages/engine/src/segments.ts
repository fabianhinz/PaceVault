// Sources: [Veness2019]
// See packages/engine/SOURCES.md for full citations.

import { degreesToRadians } from './geodesy.ts';
import type { SessionRecord, Sport } from './types.ts';

export interface SegmentTrackPoint {
  lat: number;
  lng: number;
  distanceMeters: number;
  timestampSec: number;
  elevationMeters: number | undefined;
}

export interface SegmentTrack {
  sessionId: string;
  sport: Sport;
  date: number;
  points: SegmentTrackPoint[];
}

export type SegmentReferencePoint = Omit<SegmentTrackPoint, 'timestampSec'>;

export interface SegmentPass {
  sessionId: string;
  startTimestampSec: number;
  endTimestampSec: number;
  durationSec: number;
  coverageRatio: number;
}

export interface SegmentMatchTolerances {
  corridorMeters: number;
  endToleranceMeters: number;
  minCoverageRatio: number;
}

interface SegmentReferenceFacts {
  distanceMeters: number;
  netElevationMeters: number | null;
}

type GpsRecord = SessionRecord & { lat: number; lng: number; distance: number };

interface PlanarPoint {
  xMeters: number;
  yMeters: number;
  bearingDegrees: number;
}

interface PlanarTrackPoint extends PlanarPoint {
  timestampSec: number;
}

interface PlanarTrack {
  sessionId: string;
  points: PlanarTrackPoint[];
}

interface GridHit {
  trackIndex: number;
  pointIndex: number;
}

interface Grid {
  cells: Map<string, GridHit[]>;
  radiusCells: number;
}

interface MatchContext {
  tracks: PlanarTrack[];
  grid: Grid;
  tolerances: SegmentMatchTolerances;
}

interface Walk {
  endIndex: number;
  coverageRatio: number;
}

const STEP_METERS = 10;
const CORRIDOR_METERS = 30;
const MIN_COVERAGE_RATIO = 0.95;
const END_TOLERANCE_RATIO = 0.01;
const MIN_END_TOLERANCE_METERS = 50;
const MAX_END_TOLERANCE_METERS = 200;
const MAX_BEARING_DIFFERENCE_DEGREES = 60;
const GRID_CELL_METERS = 50;
const LOOKAHEAD_POINTS = 40;
const START_CLUSTER_GAP_POINTS = 20;
const MIN_TRACK_POINTS = 10;
const BEARING_ARM_POINTS = 2;
const METERS_PER_DEGREE_LATITUDE = 110540;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111320;

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
  const first = records[0];
  if (first === undefined) return points;
  let nextMeters = Math.ceil(first.distance / STEP_METERS) * STEP_METERS;
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

const clamp = ({ value, min, max }: { value: number; min: number; max: number }): number =>
  Math.min(max, Math.max(min, value));

const metersPerDegreeLongitudeAt = (latitudeDegrees: number): number =>
  METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos(degreesToRadians(latitudeDegrees));

const projected = ({
  point,
  metersPerDegreeLongitude,
}: {
  point: { lat: number; lng: number };
  metersPerDegreeLongitude: number;
}): PlanarPoint => ({
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

const withBearings = <T extends PlanarPoint>(points: T[]): T[] => {
  points.forEach((point, i) => {
    const from = points[Math.max(0, i - BEARING_ARM_POINTS)];
    const to = points[Math.min(points.length - 1, i + BEARING_ARM_POINTS)];
    if (from === undefined || to === undefined) return;
    const radians = Math.atan2(to.xMeters - from.xMeters, to.yMeters - from.yMeters);
    point.bearingDegrees = ((radians * 180) / Math.PI + 360) % 360;
  });
  return points;
};

// An equirectangular projection around the reference's first point is accurate to well under the corridor width at the size of one person's riding area.
const planarReference = ({
  reference,
  metersPerDegreeLongitude,
}: {
  reference: SegmentReferencePoint[];
  metersPerDegreeLongitude: number;
}): PlanarPoint[] =>
  withBearings(reference.map((point) => projected({ point, metersPerDegreeLongitude })));

const planarTrack = ({
  track,
  metersPerDegreeLongitude,
}: {
  track: SegmentTrack;
  metersPerDegreeLongitude: number;
}): PlanarTrack => ({
  sessionId: track.sessionId,
  points: withBearings(
    track.points.map((point) => ({
      ...projected({ point, metersPerDegreeLongitude }),
      timestampSec: point.timestampSec,
    })),
  ),
});

const cellKey = ({ cellX, cellY }: { cellX: number; cellY: number }): string => `${cellX},${cellY}`;

const cellOf = (point: PlanarPoint): { cellX: number; cellY: number } => ({
  cellX: Math.floor(point.xMeters / GRID_CELL_METERS),
  cellY: Math.floor(point.yMeters / GRID_CELL_METERS),
});

const gridOf = ({
  tracks,
  searchMeters,
}: {
  tracks: PlanarTrack[];
  searchMeters: number;
}): Grid => {
  const cells = new Map<string, GridHit[]>();
  tracks.forEach((track, trackIndex) => {
    track.points.forEach((point, pointIndex) => {
      const key = cellKey(cellOf(point));
      const hits = cells.get(key) ?? [];
      hits.push({ trackIndex, pointIndex });
      cells.set(key, hits);
    });
  });
  return { cells, radiusCells: Math.ceil(searchMeters / GRID_CELL_METERS) };
};

const neighbourKeys = ({ point, radiusCells }: { point: PlanarPoint; radiusCells: number }) => {
  const cell = cellOf(point);
  const keys: string[] = [];
  for (let dx = -radiusCells; dx <= radiusCells; dx++) {
    for (let dy = -radiusCells; dy <= radiusCells; dy++)
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
  context,
  point,
}: {
  context: MatchContext;
  point: PlanarPoint;
}): Map<number, number[]> => {
  const indicesByTrack = new Map<number, number[]>();
  const toleranceMeters = context.tolerances.endToleranceMeters;
  for (const key of neighbourKeys({ point, radiusCells: context.grid.radiusCells })) {
    for (const hit of context.grid.cells.get(key) ?? []) {
      const candidate = context.tracks[hit.trackIndex]?.points[hit.pointIndex];
      if (candidate === undefined) continue;
      if (!sameWay({ candidate, target: point, toleranceMeters })) continue;
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
    const fraction = clamp({ value: along, min: 0, max: 1 });
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
  corridorMeters,
}: {
  track: PlanarTrack;
  index: number;
  target: PlanarPoint;
  corridorMeters: number;
}): { index: number; covered: boolean } => {
  let best = { index, distanceMeters: Number.POSITIVE_INFINITY };
  for (let look = index + 1; look <= index + LOOKAHEAD_POINTS; look++) {
    const candidate = track.points[look];
    if (candidate === undefined) break;
    const distanceMeters = planarDistanceMeters(candidate, target);
    if (distanceMeters < best.distanceMeters) best = { index: look, distanceMeters };
  }
  if (best.distanceMeters <= corridorMeters) return { index: best.index, covered: true };
  return { index, covered: false };
};

const advancedMatch = ({
  track,
  index,
  target,
  corridorMeters,
}: {
  track: PlanarTrack;
  index: number;
  target: PlanarPoint;
  corridorMeters: number;
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
  if (here !== undefined && planarDistanceMeters(here, target) <= corridorMeters) {
    return { index: current, covered: true };
  }
  return lookaheadMatch({ track, index: current, target, corridorMeters });
};

const walkAlong = ({
  stretch,
  track,
  start,
  corridorMeters,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  start: number;
  corridorMeters: number;
}): Walk => {
  let index = start;
  let coveredPoints = 0;
  for (const target of stretch) {
    const step = advancedMatch({ track, index, target, corridorMeters });
    index = step.index;
    if (step.covered) coveredPoints += 1;
  }
  return { endIndex: index, coverageRatio: coveredPoints / stretch.length };
};

const passFrom = ({
  stretch,
  track,
  start,
  tolerances,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  start: number;
  tolerances: SegmentMatchTolerances;
}): SegmentPass | undefined => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return undefined;
  const walk = walkAlong({ stretch, track, start, corridorMeters: tolerances.corridorMeters });
  const endPoint = track.points[walk.endIndex];
  if (endPoint === undefined) return undefined;
  if (planarDistanceMeters(endPoint, last) > tolerances.endToleranceMeters) return undefined;
  if (walk.coverageRatio < tolerances.minCoverageRatio) return undefined;
  const startTimestampSec = timestampAtProjection({ track, index: start, target: first });
  const endTimestampSec = timestampAtProjection({ track, index: walk.endIndex, target: last });
  if (startTimestampSec === undefined || endTimestampSec === undefined) return undefined;
  const durationSec = endTimestampSec - startTimestampSec;
  if (durationSec <= 0) return undefined;
  return {
    sessionId: track.sessionId,
    startTimestampSec,
    endTimestampSec,
    durationSec,
    coverageRatio: walk.coverageRatio,
  };
};

const fastestPassOn = ({
  stretch,
  track,
  startIndices,
  tolerances,
}: {
  stretch: PlanarPoint[];
  track: PlanarTrack;
  startIndices: number[];
  tolerances: SegmentMatchTolerances;
}): SegmentPass | undefined => {
  const first = stretch[0];
  if (first === undefined) return undefined;
  let fastest: SegmentPass | undefined = undefined;
  for (const start of startPerVisit({ indices: startIndices, track, target: first })) {
    const pass = passFrom({ stretch, track, start, tolerances });
    if (pass === undefined) continue;
    if (fastest === undefined || pass.durationSec < fastest.durationSec) fastest = pass;
  }
  return fastest;
};

const matchedPasses = ({
  stretch,
  context,
}: {
  stretch: PlanarPoint[];
  context: MatchContext;
}): SegmentPass[] => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return [];
  const atEnd = pointIndicesNear({ context, point: last });
  const passes: SegmentPass[] = [];
  for (const [trackIndex, startIndices] of pointIndicesNear({ context, point: first })) {
    const track = context.tracks[trackIndex];
    if (track === undefined || !atEnd.has(trackIndex)) continue;
    const pass = fastestPassOn({
      stretch,
      track,
      startIndices,
      tolerances: context.tolerances,
    });
    if (pass !== undefined) passes.push(pass);
  }
  return passes;
};

const firstDefined = (values: Array<number | undefined>): number | undefined =>
  values.find((value) => value !== undefined);

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
  const points = resampledPoints(records.filter(isGpsRecord));
  if (points.length < MIN_TRACK_POINTS) return undefined;
  return { sessionId, sport, date, points };
};

export const segmentReference = (records: SessionRecord[]): SegmentReferencePoint[] =>
  resampledPoints(records.filter(isGpsRecord)).map((point) => ({
    lat: point.lat,
    lng: point.lng,
    distanceMeters: point.distanceMeters,
    elevationMeters: point.elevationMeters,
  }));

export const segmentReferenceFacts = (
  reference: SegmentReferencePoint[],
): SegmentReferenceFacts => {
  const first = reference[0];
  const last = reference[reference.length - 1];
  if (first === undefined || last === undefined) {
    return { distanceMeters: 0, netElevationMeters: null };
  }
  const elevations = reference.map((point) => point.elevationMeters);
  const startElevation = firstDefined(elevations);
  const endElevation = firstDefined([...elevations].reverse());
  let netElevationMeters: number | null = null;
  if (startElevation !== undefined && endElevation !== undefined) {
    netElevationMeters = endElevation - startElevation;
  }
  return { distanceMeters: last.distanceMeters - first.distanceMeters, netElevationMeters };
};

export const matchTolerances = (lengthMeters: number): SegmentMatchTolerances => ({
  corridorMeters: CORRIDOR_METERS,
  minCoverageRatio: MIN_COVERAGE_RATIO,
  endToleranceMeters: clamp({
    value: END_TOLERANCE_RATIO * lengthMeters,
    min: MIN_END_TOLERANCE_METERS,
    max: MAX_END_TOLERANCE_METERS,
  }),
});

export const segmentPasses = ({
  reference,
  tracks,
}: {
  reference: SegmentReferencePoint[];
  tracks: SegmentTrack[];
}): SegmentPass[] => {
  const first = reference[0];
  if (first === undefined || reference.length < 2) return [];
  const metersPerDegreeLongitude = metersPerDegreeLongitudeAt(first.lat);
  const tolerances = matchTolerances(segmentReferenceFacts(reference).distanceMeters);
  const planar = tracks.map((track) => planarTrack({ track, metersPerDegreeLongitude }));
  const context: MatchContext = {
    tracks: planar,
    grid: gridOf({ tracks: planar, searchMeters: tolerances.endToleranceMeters }),
    tolerances,
  };
  return matchedPasses({
    stretch: planarReference({ reference, metersPerDegreeLongitude }),
    context,
  });
};
