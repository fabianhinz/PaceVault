import {
  segmentPasses,
  segmentReference,
  segmentTrack,
  type SegmentPass,
  type SegmentReferencePoint,
  type SegmentTrack,
} from '@pacevault/engine/segments.ts';
import { hasBoundsOverlap } from '@pacevault/engine/bounds.ts';
import {
  SPORTS,
  type SessionGPS,
  type SessionRecord,
  type Sport,
  type TrainingSession,
} from '@pacevault/engine/types.ts';
import {
  getSegmentPassesEntry,
  getSessionRecords,
  saveSegmentPassesEntry,
} from '@/lib/storage/db.ts';
import { recordSpanBetween } from '@/lib/analysis/laps.ts';
import { movingClock, movingSecondsAt, type MovingClock } from '@/lib/analysis/movingTime.ts';
import { reachesSegmentEnds } from '@/lib/analysis/segmentPrefilter.ts';
import {
  SEGMENT_MATCHER_VERSION,
  type SegmentMatchInput,
  type SegmentMatchMetrics,
  type SegmentPassesEntry,
  type SegmentSessionMeta,
  type StoredSegmentPass,
} from '@/lib/workers/segmentsContract.ts';

type ClockMs = () => number;

export interface CachedSessionTrack {
  track: SegmentTrack | undefined;
  clock: MovingClock;
}

interface MatchRun {
  segment: SegmentMatchInput;
  sessions: SegmentSessionMeta[];
  gpsBySessionId: Map<string, SessionGPS>;
  tracks: Map<string, CachedSessionTrack>;
}

interface Baseline {
  checkedSessionKeys: Set<string>;
  passes: StoredSegmentPass[];
  missReason: SegmentMatchMetrics['missReason'];
}

interface Measure {
  clockMs: ClockMs;
  recordsRead: number;
  readMs: number;
  matchMs: number;
}

interface SegmentMatch {
  entry: SegmentPassesEntry;
  metrics: SegmentMatchMetrics;
}

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const MISSING_SOURCE_VERSION = 'missing';
const PERFORMANCE_CLOCK_MS: ClockMs = () => performance.now();

const hashed = (text: string): string => {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16);
};

const segmentSessionKey = (session: SegmentSessionMeta): string =>
  `${session.sessionId}@${session.derivationVersion}`;

export const segmentMatchSessions = (sessions: TrainingSession[]): SegmentSessionMeta[] =>
  sessions
    .filter((session) => !session.isPlanned && session.hasDetailedRecords)
    .map((session) => ({
      sessionId: session.id,
      sport: session.sport,
      date: session.date,
      derivationVersion: session.derivationVersion,
    }));

export const sessionsKeyBySport = (sessions: SegmentSessionMeta[]): Record<Sport, string> => {
  const keyBySport: Record<Sport, string> = { running: '', cycling: '' };
  for (const sport of SPORTS) {
    const parts = sessions
      .filter((session) => session.sport === sport)
      .map(segmentSessionKey)
      .sort();
    keyBySport[sport] = `${sport}:${parts.length}:${hashed(parts.join('|'))}`;
  }
  return keyBySport;
};

const sourceSessionKeyOf = (run: MatchRun): string => {
  const source = run.sessions.find((session) => session.sessionId === run.segment.source.sessionId);
  if (source === undefined) return `${run.segment.source.sessionId}@${MISSING_SOURCE_VERSION}`;
  return segmentSessionKey(source);
};

const missReasonOf = ({
  cached,
  sourceSessionKey,
  ignoreCache,
}: {
  cached: SegmentPassesEntry | undefined;
  sourceSessionKey: string;
  ignoreCache: boolean;
}): SegmentMatchMetrics['missReason'] => {
  if (ignoreCache) return 'forced';
  if (cached === undefined) return 'noEntry';
  if (cached.matcherVersion !== SEGMENT_MATCHER_VERSION) return 'matcherVersion';
  if (cached.sourceSessionKey !== sourceSessionKey) return 'sourceSession';
  return null;
};

const baselineOf = ({
  cached,
  candidates,
  missReason,
}: {
  cached: SegmentPassesEntry | undefined;
  candidates: SegmentSessionMeta[];
  missReason: SegmentMatchMetrics['missReason'];
}): Baseline => {
  if (cached === undefined || missReason !== null) {
    return { checkedSessionKeys: new Set(), passes: [], missReason };
  }
  const previouslyChecked = new Set(cached.checkedSessionKeys);
  const current = candidates.filter((session) => previouslyChecked.has(segmentSessionKey(session)));
  const currentIds = new Set(current.map((session) => session.sessionId));
  return {
    checkedSessionKeys: new Set(current.map(segmentSessionKey)),
    passes: cached.passes.filter((pass) => currentIds.has(pass.sessionId)),
    missReason,
  };
};

const timed = async <T>(work: () => Promise<T> | T, options: { measure: Measure }) => {
  const startMs = options.measure.clockMs();
  const result = await work();
  return { result, elapsedMs: options.measure.clockMs() - startMs };
};

const readRecords = async ({
  sessionId,
  measure,
}: {
  sessionId: string;
  measure: Measure;
}): Promise<SessionRecord[]> => {
  const read = await timed(() => getSessionRecords(sessionId).catch((): SessionRecord[] => []), {
    measure,
  });
  measure.recordsRead += 1;
  measure.readMs += read.elapsedMs;
  return read.result;
};

const cachedTrackOf = ({
  session,
  records,
}: {
  session: SegmentSessionMeta;
  records: SessionRecord[];
}): CachedSessionTrack => ({
  track: segmentTrack({
    sessionId: session.sessionId,
    sport: session.sport,
    date: session.date,
    records,
  }),
  clock: movingClock(records),
});

const trackOf = async ({
  session,
  run,
  measure,
}: {
  session: SegmentSessionMeta;
  run: MatchRun;
  measure: Measure;
}): Promise<CachedSessionTrack> => {
  const known = run.tracks.get(session.sessionId);
  if (known !== undefined) return known;
  const records = await readRecords({ sessionId: session.sessionId, measure });
  const cached = cachedTrackOf({ session, records });
  run.tracks.set(session.sessionId, cached);
  return cached;
};

const referenceOf = async ({
  run,
  measure,
  sourceCandidate,
}: {
  run: MatchRun;
  measure: Measure;
  sourceCandidate: SegmentSessionMeta | undefined;
}): Promise<SegmentReferencePoint[]> => {
  const source = run.segment.source;
  const records = await readRecords({ sessionId: source.sessionId, measure });
  if (sourceCandidate !== undefined && !run.tracks.has(source.sessionId)) {
    run.tracks.set(source.sessionId, cachedTrackOf({ session: sourceCandidate, records }));
  }
  const span = recordSpanBetween({ records, startSec: source.startSec, endSec: source.endSec });
  if (span === null) return [];
  return segmentReference(records.slice(span.startRecord, span.endRecord + 1));
};

const inBounds = ({ session, run }: { session: SegmentSessionMeta; run: MatchRun }): boolean => {
  if (session.sessionId === run.segment.source.sessionId) return true;
  const gps = run.gpsBySessionId.get(session.sessionId);
  if (gps === undefined) return false;
  return hasBoundsOverlap({ first: gps.bounds, second: run.segment.bounds });
};

const reachesEnds = ({
  session,
  run,
  reference,
}: {
  session: SegmentSessionMeta;
  run: MatchRun;
  reference: SegmentReferencePoint[];
}): boolean => {
  if (session.sessionId === run.segment.source.sessionId) return true;
  const gps = run.gpsBySessionId.get(session.sessionId);
  if (gps === undefined) return false;
  return reachesSegmentEnds({ encodedPolyline: gps.encodedPolyline, reference });
};

const tracksOf = async ({
  sessions,
  run,
  measure,
}: {
  sessions: SegmentSessionMeta[];
  run: MatchRun;
  measure: Measure;
}): Promise<SegmentTrack[]> => {
  const tracks: SegmentTrack[] = [];
  for (const session of sessions) {
    const cached = await trackOf({ session, run, measure });
    if (cached.track !== undefined) tracks.push(cached.track);
  }
  return tracks;
};

const storedPassOf = ({
  pass,
  run,
  dateBySessionId,
}: {
  pass: SegmentPass;
  run: MatchRun;
  dateBySessionId: Map<string, number>;
}): StoredSegmentPass[] => {
  const date = dateBySessionId.get(pass.sessionId);
  const clock = run.tracks.get(pass.sessionId)?.clock;
  if (date === undefined || clock === undefined) return [];
  const startMovingSec = movingSecondsAt({ clock, timestampSec: pass.startTimestampSec });
  const endMovingSec = movingSecondsAt({ clock, timestampSec: pass.endTimestampSec });
  if (startMovingSec === undefined || endMovingSec === undefined) return [];
  return [
    {
      sessionId: pass.sessionId,
      date,
      startTimestampSec: pass.startTimestampSec,
      endTimestampSec: pass.endTimestampSec,
      movingSec: endMovingSec - startMovingSec,
      coverageRatio: pass.coverageRatio,
    },
  ];
};

const storedPasses = ({
  tracks,
  reference,
  sessions,
  run,
}: {
  tracks: SegmentTrack[];
  reference: SegmentReferencePoint[];
  sessions: SegmentSessionMeta[];
  run: MatchRun;
}): StoredSegmentPass[] => {
  const dateBySessionId = new Map(sessions.map((session) => [session.sessionId, session.date]));
  return segmentPasses({ reference, tracks }).flatMap((pass) =>
    storedPassOf({ pass, run, dateBySessionId }),
  );
};

const emptyEntry = ({
  segmentId,
  sourceSessionKey,
}: {
  segmentId: string;
  sourceSessionKey: string;
}): SegmentPassesEntry => ({
  segmentId,
  matcherVersion: SEGMENT_MATCHER_VERSION,
  sourceSessionKey,
  checkedSessionKeys: [],
  passes: [],
});

const cacheStateOf = ({
  baseline,
  unchecked,
}: {
  baseline: Baseline;
  unchecked: SegmentSessionMeta[];
}): SegmentMatchMetrics['cache'] => {
  if (baseline.missReason !== null) return 'miss';
  if (unchecked.length === 0) return 'hit';
  return 'partial';
};

const entryChanged = ({
  cached,
  baseline,
  unchecked,
}: {
  cached: SegmentPassesEntry | undefined;
  baseline: Baseline;
  unchecked: SegmentSessionMeta[];
}): boolean =>
  cached === undefined ||
  baseline.missReason !== null ||
  unchecked.length > 0 ||
  baseline.checkedSessionKeys.size !== cached.checkedSessionKeys.length ||
  baseline.passes.length !== cached.passes.length;

const newPassesOf = async ({
  unchecked,
  run,
  measure,
}: {
  unchecked: SegmentSessionMeta[];
  run: MatchRun;
  measure: Measure;
}): Promise<{
  passes: StoredSegmentPass[];
  referencePoints: number;
  candidates: number;
} | null> => {
  const candidates = unchecked.filter((session) => inBounds({ session, run }));
  if (candidates.length === 0) return { passes: [], referencePoints: 0, candidates: 0 };
  const sourceCandidate = candidates.find(
    (session) => session.sessionId === run.segment.source.sessionId,
  );
  const reference = await referenceOf({ run, measure, sourceCandidate });
  if (reference.length < 2) return null;
  const reached = candidates.filter((session) => reachesEnds({ session, run, reference }));
  const tracks = await tracksOf({ sessions: reached, run, measure });
  const matching = await timed(() => storedPasses({ tracks, reference, sessions: reached, run }), {
    measure,
  });
  measure.matchMs += matching.elapsedMs;
  return {
    passes: matching.result,
    referencePoints: reference.length,
    candidates: candidates.length,
  };
};

const settledEntry = async ({
  run,
  sourceSessionKey,
  baseline,
  unchecked,
  matched,
  cached,
}: {
  run: MatchRun;
  sourceSessionKey: string;
  baseline: Baseline;
  unchecked: SegmentSessionMeta[];
  matched: { passes: StoredSegmentPass[] } | null;
  cached: SegmentPassesEntry | undefined;
}): Promise<SegmentPassesEntry> => {
  if (matched === null) return emptyEntry({ segmentId: run.segment.segmentId, sourceSessionKey });
  const entry: SegmentPassesEntry = {
    segmentId: run.segment.segmentId,
    matcherVersion: SEGMENT_MATCHER_VERSION,
    sourceSessionKey,
    checkedSessionKeys: [...baseline.checkedSessionKeys, ...unchecked.map(segmentSessionKey)],
    passes: [...baseline.passes, ...matched.passes],
  };
  if (entryChanged({ cached, baseline, unchecked })) await saveSegmentPassesEntry(entry);
  return entry;
};

export const matchSegment = async ({
  segment,
  sessions,
  gpsBySessionId,
  tracks,
  ignoreCache,
  clockMs = PERFORMANCE_CLOCK_MS,
}: MatchRun & { ignoreCache: boolean; clockMs?: ClockMs }): Promise<SegmentMatch> => {
  const startMs = clockMs();
  const run: MatchRun = { segment, sessions, gpsBySessionId, tracks };
  const sourceSessionKey = sourceSessionKeyOf(run);
  const cached = await getSegmentPassesEntry(segment.segmentId);
  const candidates = sessions.filter((session) => session.sport === segment.sport);
  const missReason = missReasonOf({ cached, sourceSessionKey, ignoreCache });
  const baseline = baselineOf({ cached, candidates, missReason });
  const unchecked = candidates.filter(
    (session) => !baseline.checkedSessionKeys.has(segmentSessionKey(session)),
  );
  const measure: Measure = { clockMs, recordsRead: 0, readMs: 0, matchMs: 0 };
  const matched = await newPassesOf({ unchecked, run, measure });
  const metrics: SegmentMatchMetrics = {
    segmentId: segment.segmentId,
    cache: cacheStateOf({ baseline, unchecked }),
    missReason,
    sessionsChecked: unchecked.length,
    bboxCandidates: matched?.candidates ?? 0,
    recordsRead: measure.recordsRead,
    readMs: measure.readMs,
    matchMs: measure.matchMs,
    referencePoints: matched?.referencePoints ?? 0,
    passes: 0,
    ms: 0,
  };
  const entry = await settledEntry({ run, sourceSessionKey, baseline, unchecked, matched, cached });
  return { entry, metrics: { ...metrics, passes: entry.passes.length, ms: clockMs() - startMs } };
};
