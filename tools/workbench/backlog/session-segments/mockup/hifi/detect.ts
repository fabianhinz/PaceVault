import { detectClimbs } from '@pacevault/engine/climbs.ts';
import { haversineDistanceMeters, initialBearingDegrees } from '@pacevault/engine/geodesy.ts';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

export interface DetectSession {
  id: string;
  sport: Sport;
  date: number;
  records: SessionRecord[];
}

export type SegmentType = 'climb' | 'flat' | 'descent' | 'route';

export interface DetectedPass {
  sessionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  seconds: number;
  splitSeconds: number[];
  coverage: number;
}

export interface DetectedSegment {
  sport: Sport;
  type: SegmentType;
  leadSessionId: string;
  distanceMeters: number;
  netElevationMeters: number;
  geometry: Array<[number, number]>;
  passes: DetectedPass[];
}

export interface DetectionStats {
  sport: Sport;
  gpsSessions: number;
  leadsProcessed: number;
  leadsSkippedAsSameRoute: number;
  atoms: number;
  atomsWithTwoPasses: number;
  joinedCandidates: number;
  droppedAsWholeRoute: number;
  droppedAsDuplicate: number;
  droppedShort: number;
  turnAnchors: number;
  climbAnchors: number;
}

const STEP_METERS = 10;
const CORRIDOR_METERS = 30;
const END_TOLERANCE_METERS = 50;
const MIN_COVERAGE = 0.95;
const MAX_BEARING_DIFFERENCE_DEGREES = 60;
const TURN_DEGREES = 60;
const TURN_ARM_POINTS = 3;
const TURN_CUT_AFTER_POINTS = 3;
const JOIN_JACCARD = 0.9;
const GRID_METERS = 50;
const LOOKAHEAD_POINTS = 40;
const SPLIT_COUNT = 24;
const SAME_ROUTE_LENGTH_RATIO = 0.1;
const TYPE_GRADE = 0.025;
const MIN_SEGMENT_METERS_BY_SPORT: Record<Sport, number> = { running: 300, cycling: 1000 };

interface TrackPoint {
  lat: number;
  lng: number;
  x: number;
  y: number;
  distance: number;
  time: number;
  elevation: number | undefined;
  bearing: number;
}

interface Track {
  session: DetectSession;
  points: TrackPoint[];
  lengthMeters: number;
}

interface Grid {
  cells: Map<string, Array<{ track: number; point: number }>>;
}

const metresPerDegreeLatitude = 110540;

const projector = (referenceLatitude: number) => {
  const metresPerDegreeLongitude = 111320 * Math.cos((referenceLatitude * Math.PI) / 180);
  return (lat: number, lng: number) => ({ x: lng * metresPerDegreeLongitude, y: lat * metresPerDegreeLatitude });
};

const planarDistance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

const bearingDifference = (a: number, b: number) => {
  const difference = Math.abs(a - b) % 360;
  if (difference > 180) return 360 - difference;
  return difference;
};

const interpolate = (from: number, to: number, fraction: number) => from + (to - from) * fraction;

const optionalInterpolate = (from: number | undefined, to: number | undefined, fraction: number) => {
  if (from === undefined || to === undefined) return undefined;
  return interpolate(from, to, fraction);
};

const gpsRecords = (records: SessionRecord[]) =>
  records.filter(
    (record) => record.lat !== undefined && record.lng !== undefined && record.distance !== undefined,
  );

const withBearings = (points: TrackPoint[]) => {
  for (let i = 0; i < points.length; i++) {
    const from = points[Math.max(0, i - 2)];
    const to = points[Math.min(points.length - 1, i + 2)];
    if (from === undefined || to === undefined) continue;
    const point = points[i];
    if (point === undefined) continue;
    point.bearing = (Math.atan2(to.x - from.x, to.y - from.y) * (180 / Math.PI) + 360) % 360;
  }
  return points;
};

const resampleTrack = ({ session, project }: { session: DetectSession; project: ReturnType<typeof projector> }): Track => {
  const records = gpsRecords(session.records);
  const points: TrackPoint[] = [];
  let next = 0;
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (previous === undefined || current === undefined) continue;
    const fromDistance = previous.distance ?? 0;
    const toDistance = current.distance ?? 0;
    if (toDistance <= fromDistance) continue;
    while (next <= toDistance) {
      if (next >= fromDistance) {
        const fraction = (next - fromDistance) / (toDistance - fromDistance);
        const lat = interpolate(previous.lat ?? 0, current.lat ?? 0, fraction);
        const lng = interpolate(previous.lng ?? 0, current.lng ?? 0, fraction);
        const projected = project(lat, lng);
        points.push({
          lat,
          lng,
          x: projected.x,
          y: projected.y,
          distance: next,
          time: interpolate(previous.timestamp, current.timestamp, fraction),
          elevation: optionalInterpolate(previous.elevation, current.elevation, fraction),
          bearing: 0,
        });
      }
      next += STEP_METERS;
    }
  }
  return { session, points: withBearings(points), lengthMeters: next - STEP_METERS };
};

const cellKey = (cellX: number, cellY: number) => `${cellX},${cellY}`;

const buildGrid = (tracks: Track[]): Grid => {
  const cells = new Map<string, Array<{ track: number; point: number }>>();
  tracks.forEach((track, trackIndex) => {
    track.points.forEach((point, pointIndex) => {
      const key = cellKey(Math.floor(point.x / GRID_METERS), Math.floor(point.y / GRID_METERS));
      const list = cells.get(key) ?? [];
      list.push({ track: trackIndex, point: pointIndex });
      cells.set(key, list);
    });
  });
  return { cells };
};

const nearby = ({ grid, point }: { grid: Grid; point: TrackPoint }) => {
  const cellX = Math.floor(point.x / GRID_METERS);
  const cellY = Math.floor(point.y / GRID_METERS);
  const found: Array<{ track: number; point: number }> = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) found.push(...(grid.cells.get(cellKey(cellX + dx, cellY + dy)) ?? []));
  }
  return found;
};

const tracksNear = ({ grid, tracks, point }: { grid: Grid; tracks: Track[]; point: TrackPoint }) => {
  const result = new Map<number, number[]>();
  for (const hit of nearby({ grid, point })) {
    const candidate = tracks[hit.track]?.points[hit.point];
    if (candidate === undefined) continue;
    if (planarDistance(candidate, point) > END_TOLERANCE_METERS) continue;
    if (bearingDifference(candidate.bearing, point.bearing) > MAX_BEARING_DIFFERENCE_DEGREES) continue;
    const list = result.get(hit.track) ?? [];
    list.push(hit.point);
    result.set(hit.track, list);
  }
  return result;
};

const clusterStarts = ({ indices, track, target }: { indices: number[]; track: Track; target: TrackPoint }) => {
  const sorted = [...indices].sort((a, b) => a - b);
  const starts: number[] = [];
  let cluster: number[] = [];
  const closeCluster = () => {
    let best: number | undefined = undefined;
    for (const index of cluster) {
      const point = track.points[index];
      if (point === undefined) continue;
      const bestPoint = track.points[best ?? -1];
      if (bestPoint === undefined || planarDistance(point, target) < planarDistance(bestPoint, target)) best = index;
    }
    if (best !== undefined) starts.push(best);
    cluster = [];
  };
  for (const index of sorted) {
    const last = cluster[cluster.length - 1];
    if (last !== undefined && index - last > 20) closeCluster();
    cluster.push(index);
  }
  closeCluster();
  return starts;
};

const timeAtProjection = ({ track, index, target }: { track: Track; index: number; target: TrackPoint }) => {
  const point = track.points[index];
  if (point === undefined) return 0;
  let bestTime = point.time;
  let bestDistance = planarDistance(point, target);
  for (const neighbourIndex of [index - 1, index + 1]) {
    const neighbour = track.points[neighbourIndex];
    if (neighbour === undefined) continue;
    const segmentX = neighbour.x - point.x;
    const segmentY = neighbour.y - point.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    if (lengthSquared === 0) continue;
    const fraction = Math.max(0, Math.min(1, ((target.x - point.x) * segmentX + (target.y - point.y) * segmentY) / lengthSquared));
    const projected = { x: point.x + segmentX * fraction, y: point.y + segmentY * fraction };
    const distance = planarDistance(projected, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTime = interpolate(point.time, neighbour.time, fraction);
    }
  }
  return bestTime;
};

const advance = ({ track, index, target }: { track: Track; index: number; target: TrackPoint }) => {
  let current = index;
  while (true) {
    const here = track.points[current];
    const ahead = track.points[current + 1];
    if (here === undefined || ahead === undefined) break;
    if (planarDistance(ahead, target) > planarDistance(here, target)) break;
    current += 1;
  }
  const here = track.points[current];
  if (here !== undefined && planarDistance(here, target) <= CORRIDOR_METERS) return { index: current, covered: true };
  let best = current;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let look = current + 1; look <= current + LOOKAHEAD_POINTS; look++) {
    const candidate = track.points[look];
    if (candidate === undefined) break;
    const distance = planarDistance(candidate, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = look;
    }
  }
  if (bestDistance <= CORRIDOR_METERS) return { index: best, covered: true };
  return { index: current, covered: false };
};

const splitIndices = (length: number) =>
  Array.from({ length: SPLIT_COUNT + 1 }, (_, i) => Math.round((i / SPLIT_COUNT) * (length - 1)));

const walkFrom = ({ stretch, track, start }: { stretch: TrackPoint[]; track: Track; start: number }) => {
  let index = start;
  let covered = 0;
  const timeByStretchIndex: number[] = [];
  for (const target of stretch) {
    const step = advance({ track, index, target });
    index = step.index;
    if (step.covered) covered += 1;
    timeByStretchIndex.push(track.points[index]?.time ?? 0);
  }
  return { endIndex: index, coverage: covered / stretch.length, timeByStretchIndex };
};

export const matchPass = ({ stretch, track, startIndices }: { stretch: TrackPoint[]; track: Track; startIndices: number[] }) => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return undefined;
  let best: DetectedPass | undefined = undefined;
  for (const start of clusterStarts({ indices: startIndices, track, target: first })) {
    const walk = walkFrom({ stretch, track, start });
    const endPoint = track.points[walk.endIndex];
    if (endPoint === undefined || planarDistance(endPoint, last) > END_TOLERANCE_METERS) continue;
    if (walk.coverage < MIN_COVERAGE) continue;
    const startTimeSeconds = timeAtProjection({ track, index: start, target: first });
    const endTimeSeconds = timeAtProjection({ track, index: walk.endIndex, target: last });
    const seconds = endTimeSeconds - startTimeSeconds;
    if (seconds <= 0) continue;
    if (best !== undefined && best.seconds <= seconds) continue;
    const splitSeconds = splitIndices(stretch.length).map((i) => (walk.timeByStretchIndex[i] ?? startTimeSeconds) - startTimeSeconds);
    splitSeconds[0] = 0;
    splitSeconds[SPLIT_COUNT] = seconds;
    best = { sessionId: track.session.id, startTimeSeconds, endTimeSeconds, seconds, splitSeconds, coverage: walk.coverage };
  }
  return best;
};

const passesFor = ({ stretch, tracks, grid }: { stretch: TrackPoint[]; tracks: Track[]; grid: Grid }) => {
  const first = stretch[0];
  const last = stretch[stretch.length - 1];
  if (first === undefined || last === undefined) return [];
  const atStart = tracksNear({ grid, tracks, point: first });
  const atEnd = tracksNear({ grid, tracks, point: last });
  const passes: DetectedPass[] = [];
  for (const entry of atStart) {
    if (!atEnd.has(entry[0])) continue;
    const track = tracks[entry[0]];
    if (track === undefined) continue;
    const pass = matchPass({ stretch, track, startIndices: entry[1] });
    if (pass !== undefined) passes.push(pass);
  }
  return passes;
};

const turnAnchors = (track: Track) => {
  const anchors: number[] = [];
  let clusterBest: { index: number; angle: number } | undefined = undefined;
  for (let i = TURN_ARM_POINTS; i < track.points.length - TURN_ARM_POINTS; i++) {
    const before = track.points[i - TURN_ARM_POINTS];
    const here = track.points[i];
    const after = track.points[i + TURN_ARM_POINTS];
    if (before === undefined || here === undefined || after === undefined) continue;
    const angle = bearingDifference(
      initialBearingDegrees({ from: before, to: here }),
      initialBearingDegrees({ from: here, to: after }),
    );
    if (angle >= TURN_DEGREES) {
      if (clusterBest === undefined || angle > clusterBest.angle) clusterBest = { index: i, angle };
      continue;
    }
    if (clusterBest !== undefined) anchors.push(clusterBest.index + TURN_CUT_AFTER_POINTS);
    clusterBest = undefined;
  }
  return anchors;
};

const pointIndexAtDistance = ({ track, distance }: { track: Track; distance: number | undefined }) => {
  if (distance === undefined) return undefined;
  return Math.max(0, Math.min(track.points.length - 1, Math.round(distance / STEP_METERS)));
};

const climbSpans = (track: Track) => {
  const records = gpsRecords(track.session.records);
  const climbs = detectClimbs({ sport: track.session.sport, records, gradients: windowedGradients(records) });
  const spans: Array<{ from: number; to: number }> = [];
  for (const climb of climbs) {
    const from = pointIndexAtDistance({ track, distance: records[climb.startIndex]?.distance });
    const to = pointIndexAtDistance({ track, distance: records[climb.endIndex]?.distance });
    if (from !== undefined && to !== undefined && to > from) spans.push({ from, to });
  }
  return spans;
};

const atomBoundaries = ({ track, anchors, minPoints }: { track: Track; anchors: number[]; minPoints: number }) => {
  const last = track.points.length - 1;
  const boundaries = [...new Set([0, ...anchors.filter((a) => a > 0 && a < last), last])].sort((a, b) => a - b);
  while (boundaries.length > 2) {
    let shortest = -1;
    let shortestLength = Number.POSITIVE_INFINITY;
    for (let i = 0; i < boundaries.length - 1; i++) {
      const length = (boundaries[i + 1] ?? 0) - (boundaries[i] ?? 0);
      if (length < shortestLength) {
        shortestLength = length;
        shortest = i;
      }
    }
    if (shortestLength >= minPoints) break;
    let leftLength = Number.POSITIVE_INFINITY;
    if (shortest > 0) leftLength = (boundaries[shortest] ?? 0) - (boundaries[shortest - 1] ?? 0);
    let rightLength = Number.POSITIVE_INFINITY;
    if (shortest + 2 < boundaries.length) rightLength = (boundaries[shortest + 2] ?? 0) - (boundaries[shortest + 1] ?? 0);
    if (leftLength <= rightLength) boundaries.splice(shortest, 1);
    else boundaries.splice(shortest + 1, 1);
  }
  return boundaries;
};

const jaccard = (a: Set<string>, b: Set<string>) => {
  let shared = 0;
  for (const id of a) if (b.has(id)) shared += 1;
  const union = a.size + b.size - shared;
  if (union === 0) return 0;
  return shared / union;
};

const netElevation = (stretch: TrackPoint[]) => {
  const first = stretch.find((p) => p.elevation !== undefined)?.elevation;
  const last = [...stretch].reverse().find((p) => p.elevation !== undefined)?.elevation;
  if (first === undefined || last === undefined) return 0;
  return last - first;
};

const segmentType = ({ from, to, climbs, stretch }: { from: number; to: number; climbs: Array<{ from: number; to: number }>; stretch: TrackPoint[] }): SegmentType => {
  const length = to - from;
  let inClimb = 0;
  for (const climb of climbs) inClimb += Math.max(0, Math.min(to, climb.to) - Math.max(from, climb.from));
  const grade = netElevation(stretch) / Math.max(STEP_METERS, length * STEP_METERS);
  if (inClimb >= length / 2 || grade >= TYPE_GRADE) return 'climb';
  if (grade <= -TYPE_GRADE) return 'descent';
  return 'flat';
};

const thinGeometry = (stretch: TrackPoint[]): Array<[number, number]> => {
  const step = Math.max(1, Math.ceil(stretch.length / 200));
  const kept = stretch.filter((_, i) => i % step === 0 || i === stretch.length - 1);
  return kept.map((p) => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lng * 1e5) / 1e5]);
};

const stretchLength = (stretch: TrackPoint[]) => {
  let total = 0;
  for (let i = 1; i < stretch.length; i++) {
    const from = stretch[i - 1];
    const to = stretch[i];
    if (from !== undefined && to !== undefined) total += haversineDistanceMeters({ from, to });
  }
  return total;
};

interface Candidate {
  segment: DetectedSegment;
  stretch: TrackPoint[];
  passIds: Set<string>;
}

const sameStretch = (a: TrackPoint[], b: TrackPoint[]) => {
  const aFirst = a[0];
  const aLast = a[a.length - 1];
  const bFirst = b[0];
  const bLast = b[b.length - 1];
  if (aFirst === undefined || aLast === undefined || bFirst === undefined || bLast === undefined) return false;
  if (Math.abs(a.length - b.length) > SAME_ROUTE_LENGTH_RATIO * Math.max(a.length, b.length)) return false;
  return planarDistance(aFirst, bFirst) <= END_TOLERANCE_METERS && planarDistance(aLast, bLast) <= END_TOLERANCE_METERS;
};

const OVERLAP_SHARE = 0.8;

const overlapShare = (a: TrackPoint[], b: TrackPoint[]) => {
  const cells = new Map<string, TrackPoint[]>();
  for (const point of b) {
    const key = cellKey(Math.floor(point.x / GRID_METERS), Math.floor(point.y / GRID_METERS));
    const list = cells.get(key) ?? [];
    list.push(point);
    cells.set(key, list);
  }
  let inside = 0;
  for (const point of a) {
    const cellX = Math.floor(point.x / GRID_METERS);
    const cellY = Math.floor(point.y / GRID_METERS);
    let hit = false;
    for (let dx = -1; dx <= 1 && !hit; dx++) {
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        for (const other of cells.get(cellKey(cellX + dx, cellY + dy)) ?? []) {
          if (planarDistance(other, point) > CORRIDOR_METERS) continue;
          if (bearingDifference(other.bearing, point.bearing) > MAX_BEARING_DIFFERENCE_DEGREES) continue;
          hit = true;
          break;
        }
      }
    }
    if (hit) inside += 1;
  }
  return inside / Math.max(1, a.length);
};

const duplicateOf = (existing: Candidate, next: Candidate) => {
  if (sameStretch(existing.stretch, next.stretch)) return true;
  if (jaccard(existing.passIds, next.passIds) < JOIN_JACCARD) return false;
  return overlapShare(next.stretch, existing.stretch) >= OVERLAP_SHARE && overlapShare(existing.stretch, next.stretch) >= OVERLAP_SHARE;
};

const emptyStats = (sport: Sport, gpsSessions: number): DetectionStats => ({
  sport,
  gpsSessions,
  leadsProcessed: 0,
  leadsSkippedAsSameRoute: 0,
  atoms: 0,
  atomsWithTwoPasses: 0,
  joinedCandidates: 0,
  droppedAsWholeRoute: 0,
  droppedAsDuplicate: 0,
  droppedShort: 0,
  turnAnchors: 0,
  climbAnchors: 0,
});

const groupAtoms = ({ boundaries, atomPassIds }: { boundaries: number[]; atomPassIds: Array<Set<string>> }) => {
  const groups: Array<{ from: number; to: number }> = [];
  let open: { from: number; to: number; ids: Set<string> } | undefined = undefined;
  atomPassIds.forEach((ids, i) => {
    const from = boundaries[i] ?? 0;
    const to = boundaries[i + 1] ?? 0;
    if (ids.size < 2) {
      if (open !== undefined) groups.push({ from: open.from, to: open.to });
      open = undefined;
      return;
    }
    if (open !== undefined && jaccard(open.ids, ids) >= JOIN_JACCARD) {
      open.to = to;
      return;
    }
    if (open !== undefined) groups.push({ from: open.from, to: open.to });
    open = { from, to, ids };
  });
  const last: { from: number; to: number } | undefined = open;
  if (last !== undefined) groups.push({ from: last.from, to: last.to });
  return groups;
};

const detectForLead = ({ lead, tracks, grid, accepted, stats }: { lead: Track; tracks: Track[]; grid: Grid; accepted: Candidate[]; stats: DetectionStats }) => {
  const sport = lead.session.sport;
  const minPoints = MIN_SEGMENT_METERS_BY_SPORT[sport] / STEP_METERS;
  const found: Candidate[] = [];
  const whole = passesFor({ stretch: lead.points, tracks, grid });
  const hasRoute = whole.length >= 2;
  const candidate = ({ from, to, type, passes }: { from: number; to: number; type: SegmentType; passes: DetectedPass[] }) => {
    const stretch = lead.points.slice(from, to + 1);
    found.push({
      stretch,
      passIds: new Set(passes.map((p) => p.sessionId)),
      segment: {
        sport,
        type,
        leadSessionId: lead.session.id,
        distanceMeters: stretchLength(stretch),
        netElevationMeters: netElevation(stretch),
        geometry: thinGeometry(stretch),
        passes,
      },
    });
  };
  if (hasRoute) candidate({ from: 0, to: lead.points.length - 1, type: 'route', passes: whole });
  const turns = turnAnchors(lead);
  const climbs = climbSpans(lead);
  stats.turnAnchors += turns.length;
  stats.climbAnchors += climbs.length * 2;
  const boundaries = atomBoundaries({ track: lead, anchors: [...turns, ...climbs.flatMap((c) => [c.from, c.to])], minPoints });
  const atomPassIds = boundaries.slice(0, -1).map((from, i) => {
    const stretch = lead.points.slice(from, (boundaries[i + 1] ?? from) + 1);
    return new Set(passesFor({ stretch, tracks, grid }).map((p) => p.sessionId));
  });
  stats.atoms += atomPassIds.length;
  stats.atomsWithTwoPasses += atomPassIds.filter((ids) => ids.size >= 2).length;
  for (const group of groupAtoms({ boundaries, atomPassIds })) {
    stats.joinedCandidates += 1;
    if (hasRoute && group.to - group.from >= MIN_COVERAGE * (lead.points.length - 1)) {
      stats.droppedAsWholeRoute += 1;
      continue;
    }
    if (group.to - group.from < minPoints) {
      stats.droppedShort += 1;
      continue;
    }
    const stretch = lead.points.slice(group.from, group.to + 1);
    const passes = passesFor({ stretch, tracks, grid });
    if (passes.length < 2) continue;
    candidate({ from: group.from, to: group.to, type: segmentType({ from: group.from, to: group.to, climbs, stretch }), passes });
  }
  for (const next of found) {
    if (accepted.some((existing) => duplicateOf(existing, next))) {
      stats.droppedAsDuplicate += 1;
      continue;
    }
    accepted.push(next);
  }
};

const leadAlreadyCovered = ({ lead, accepted }: { lead: Track; accepted: Candidate[] }) =>
  accepted.some(
    (existing) =>
      existing.segment.type === 'route' &&
      existing.passIds.has(lead.session.id) &&
      Math.abs(existing.stretch.length - lead.points.length) <= SAME_ROUTE_LENGTH_RATIO * lead.points.length,
  );

export const detectSegmentsForSport = ({ sport, sessions }: { sport: Sport; sessions: DetectSession[] }) => {
  const own = sessions.filter((s) => s.sport === sport).sort((a, b) => b.date - a.date);
  const firstGps = own.flatMap((s) => gpsRecords(s.records).slice(0, 1))[0];
  const project = projector(firstGps?.lat ?? 0);
  const tracks = own.map((session) => resampleTrack({ session, project })).filter((t) => t.points.length >= 10);
  const stats = emptyStats(sport, tracks.length);
  const grid = buildGrid(tracks);
  const accepted: Candidate[] = [];
  for (const lead of tracks) {
    if (leadAlreadyCovered({ lead, accepted })) {
      stats.leadsSkippedAsSameRoute += 1;
      continue;
    }
    stats.leadsProcessed += 1;
    detectForLead({ lead, tracks, grid, accepted, stats });
  }
  return { segments: accepted.map((c) => c.segment), stats };
};
