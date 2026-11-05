import {
  segmentPasses,
  segmentReference,
  segmentTrack,
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
import {
  SEGMENT_MATCHER_VERSION,
  type SegmentMatchInput,
  type SegmentMatchMetrics,
  type SegmentPassesEntry,
  type SegmentSessionMeta,
  type StoredSegmentPass,
} from '@/lib/workers/segmentsContract.ts';

type ClockMs = () => number;

interface MatchRun {
  segment: SegmentMatchInput;
  sessions: SegmentSessionMeta[];
  gpsBySessionId: Map<string, SessionGPS>;
  records: Map<string, SessionRecord[]>;
}

interface Baseline {
  checkedSessionKeys: Set<string>;
  passes: StoredSegmentPass[];
  missReason: SegmentMatchMetrics['missReason'];
}

interface Reading {
  recordsRead: number;
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

const recordsOf = async ({
  sessionId,
  run,
  reading,
}: {
  sessionId: string;
  run: MatchRun;
  reading: Reading;
}): Promise<SessionRecord[]> => {
  const known = run.records.get(sessionId);
  if (known !== undefined) return known;
  const records = await getSessionRecords(sessionId).catch((): SessionRecord[] => []);
  reading.recordsRead += 1;
  run.records.set(sessionId, records);
  return records;
};

const referenceOf = async ({
  run,
  reading,
}: {
  run: MatchRun;
  reading: Reading;
}): Promise<SegmentReferencePoint[]> => {
  const source = run.segment.source;
  const records = await recordsOf({ sessionId: source.sessionId, run, reading });
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

const tracksOf = async ({
  sessions,
  run,
  reading,
}: {
  sessions: SegmentSessionMeta[];
  run: MatchRun;
  reading: Reading;
}): Promise<SegmentTrack[]> => {
  const tracks: SegmentTrack[] = [];
  for (const session of sessions) {
    const records = await recordsOf({ sessionId: session.sessionId, run, reading });
    const track = segmentTrack({ ...session, records });
    if (track !== undefined) tracks.push(track);
  }
  return tracks;
};

const datedPasses = ({
  tracks,
  reference,
  sessions,
}: {
  tracks: SegmentTrack[];
  reference: SegmentReferencePoint[];
  sessions: SegmentSessionMeta[];
}): StoredSegmentPass[] => {
  const dateBySessionId = new Map(sessions.map((session) => [session.sessionId, session.date]));
  return segmentPasses({ reference, tracks }).flatMap((pass) => {
    const date = dateBySessionId.get(pass.sessionId);
    if (date === undefined) return [];
    return [{ ...pass, date }];
  });
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

const unchangedEntry = ({
  cached,
  entry,
}: {
  cached: SegmentPassesEntry | undefined;
  entry: SegmentPassesEntry;
}): boolean =>
  cached !== undefined &&
  cached.passes.length === entry.passes.length &&
  cached.checkedSessionKeys.length === entry.checkedSessionKeys.length &&
  cached.sourceSessionKey === entry.sourceSessionKey &&
  cached.matcherVersion === entry.matcherVersion;

const newPassesOf = async ({
  unchecked,
  run,
  reading,
}: {
  unchecked: SegmentSessionMeta[];
  run: MatchRun;
  reading: Reading;
}): Promise<{
  passes: StoredSegmentPass[];
  referencePoints: number;
  candidates: number;
} | null> => {
  const candidates = unchecked.filter((session) => inBounds({ session, run }));
  if (candidates.length === 0) return { passes: [], referencePoints: 0, candidates: 0 };
  const reference = await referenceOf({ run, reading });
  if (reference.length < 2) return null;
  const tracks = await tracksOf({ sessions: candidates, run, reading });
  return {
    passes: datedPasses({ tracks, reference, sessions: candidates }),
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
  if (!unchangedEntry({ cached, entry })) await saveSegmentPassesEntry(entry);
  return entry;
};

export const matchSegment = async ({
  segment,
  sessions,
  gpsBySessionId,
  records,
  ignoreCache,
  clockMs = PERFORMANCE_CLOCK_MS,
}: MatchRun & { ignoreCache: boolean; clockMs?: ClockMs }): Promise<SegmentMatch> => {
  const startMs = clockMs();
  const run: MatchRun = { segment, sessions, gpsBySessionId, records };
  const sourceSessionKey = sourceSessionKeyOf(run);
  const cached = await getSegmentPassesEntry(segment.segmentId);
  const candidates = sessions.filter((session) => session.sport === segment.sport);
  const missReason = missReasonOf({ cached, sourceSessionKey, ignoreCache });
  const baseline = baselineOf({ cached, candidates, missReason });
  const unchecked = candidates.filter(
    (session) => !baseline.checkedSessionKeys.has(segmentSessionKey(session)),
  );
  const reading: Reading = { recordsRead: 0 };
  const matched = await newPassesOf({ unchecked, run, reading });
  const metrics: SegmentMatchMetrics = {
    segmentId: segment.segmentId,
    cache: cacheStateOf({ baseline, unchecked }),
    missReason,
    sessionsChecked: unchecked.length,
    bboxCandidates: matched?.candidates ?? 0,
    recordsRead: reading.recordsRead,
    referencePoints: matched?.referencePoints ?? 0,
    passes: 0,
    ms: 0,
  };
  const entry = await settledEntry({ run, sourceSessionKey, baseline, unchecked, matched, cached });
  return { entry, metrics: { ...metrics, passes: entry.passes.length, ms: clockMs() - startMs } };
};
