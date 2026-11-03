import {
  segmentDetectionResult,
  segmentTrack,
  type DetectedSegment,
  type SegmentDetectionStats,
  type SegmentTrack,
} from '@pacevault/engine/segments.ts';
import { SPORTS, type Sport, type TrainingSession } from '@pacevault/engine/types.ts';
import { getSessionRecords, getStoredSegments, saveStoredSegments } from '@/lib/storage/db.ts';
import {
  SEGMENT_DETECTOR_VERSION,
  type Segment,
  type SegmentDetectionInput,
  type SegmentSessionMeta,
  type SportDetectionMetrics,
  type StoredSegmentPass,
  type StoredSegments,
} from '@/lib/workers/segmentsContract.ts';

const MAX_GEOMETRY_POINTS = 200;
const COORDINATE_DECIMALS_FACTOR = 1e5;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const hashed = (text: string): string => {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16);
};

export const segmentsSessionsKey = (sessions: SegmentSessionMeta[]): string => {
  const parts = sessions
    .map((session) => `${session.sessionId}@${session.derivationVersion}`)
    .sort();
  return `${parts.length}:${hashed(parts.join('|'))}`;
};

const sessionMeta = (session: TrainingSession): SegmentSessionMeta => ({
  sessionId: session.id,
  sport: session.sport,
  date: session.date,
  derivationVersion: session.derivationVersion,
});

export const segmentDetectionInputs = (sessions: TrainingSession[]): SegmentDetectionInput[] => {
  const usable = sessions.filter((session) => !session.isPlanned && session.hasDetailedRecords);
  return SPORTS.map((sport) => {
    const own = usable.filter((session) => session.sport === sport).map(sessionMeta);
    return { sport, sessionsKey: segmentsSessionsKey(own), sessions: own };
  });
};

const thinnedGeometry = (geometry: Array<[number, number]>): Array<[number, number]> => {
  const step = Math.max(1, Math.ceil(geometry.length / MAX_GEOMETRY_POINTS));
  const kept = geometry.filter((_, i) => i % step === 0 || i === geometry.length - 1);
  return kept.map((point) => [
    Math.round(point[0] * COORDINATE_DECIMALS_FACTOR) / COORDINATE_DECIMALS_FACTOR,
    Math.round(point[1] * COORDINATE_DECIMALS_FACTOR) / COORDINATE_DECIMALS_FACTOR,
  ]);
};

const storedSegment = ({
  segment,
  dateBySessionId,
}: {
  segment: DetectedSegment;
  dateBySessionId: Map<string, number>;
}): Segment => {
  const passes: StoredSegmentPass[] = segment.passes.map((pass) => ({
    ...pass,
    date: dateBySessionId.get(pass.sessionId) ?? 0,
  }));
  return {
    id: `${segment.leadSessionId}:${Math.round(segment.startMeters)}-${Math.round(segment.endMeters)}`,
    sport: segment.sport,
    type: segment.type,
    typeNumber: 0,
    distanceMeters: segment.distanceMeters,
    netElevationMeters: segment.netElevationMeters,
    geometry: thinnedGeometry(segment.geometry),
    passes,
    lastPassDate: Math.max(...passes.map((pass) => pass.date)),
  };
};

export const numberedByRecency = (segments: Segment[]): Segment[] => {
  const countByType = new Map<Segment['type'], number>();
  const ordered = [...segments].sort(
    (a, b) => b.lastPassDate - a.lastPassDate || a.id.localeCompare(b.id),
  );
  return ordered.map((segment) => {
    const typeNumber = (countByType.get(segment.type) ?? 0) + 1;
    countByType.set(segment.type, typeNumber);
    return { ...segment, typeNumber };
  });
};

interface TrackReading {
  tracks: SegmentTrack[];
  sessionsWithRecords: number;
  records: number;
  resampledPoints: number;
  readRecordsMs: number;
  slowestSessionReadMs: number;
  segmentTrackMs: number;
}

export interface SportDetection {
  entry: StoredSegments;
  metrics: SportDetectionMetrics;
}

type ClockMs = () => number;

const PERFORMANCE_CLOCK_MS: ClockMs = () => performance.now();

const readSession = async ({
  sport,
  session,
  reading,
  clockMs,
}: {
  sport: Sport;
  session: SegmentSessionMeta;
  reading: TrackReading;
  clockMs: ClockMs;
}): Promise<void> => {
  const readStartMs = clockMs();
  const records = await getSessionRecords(session.sessionId).catch(() => []);
  const readMs = clockMs() - readStartMs;
  reading.readRecordsMs += readMs;
  reading.slowestSessionReadMs = Math.max(reading.slowestSessionReadMs, readMs);
  if (records.length > 0) reading.sessionsWithRecords += 1;
  reading.records += records.length;
  const trackStartMs = clockMs();
  const track = segmentTrack({ sessionId: session.sessionId, sport, date: session.date, records });
  reading.segmentTrackMs += clockMs() - trackStartMs;
  if (track === undefined) return;
  reading.tracks.push(track);
  reading.resampledPoints += track.points.length;
};

const tracksOf = async ({
  sport,
  sessions,
  clockMs,
}: {
  sport: Sport;
  sessions: SegmentSessionMeta[];
  clockMs: ClockMs;
}): Promise<TrackReading> => {
  const reading: TrackReading = {
    tracks: [],
    sessionsWithRecords: 0,
    records: 0,
    resampledPoints: 0,
    readRecordsMs: 0,
    slowestSessionReadMs: 0,
    segmentTrackMs: 0,
  };
  for (const session of sessions) await readSession({ sport, session, reading, clockMs });
  return reading;
};

const missReasonOf = ({
  cached,
  input,
  ignoreCache,
}: {
  cached: StoredSegments | undefined;
  input: SegmentDetectionInput;
  ignoreCache: boolean;
}): SportDetectionMetrics['missReason'] => {
  if (ignoreCache) return 'forced';
  if (cached === undefined) return 'noEntry';
  if (cached.detectorVersion !== SEGMENT_DETECTOR_VERSION) return 'detectorVersion';
  if (cached.sessionsKey !== input.sessionsKey) return 'sessionsKey';
  return null;
};

const segmentsByTypeOf = (segments: Segment[]): SportDetectionMetrics['segmentsByType'] => {
  const counts = { climb: 0, flat: 0, descent: 0, route: 0 };
  for (const segment of segments) counts[segment.type] += 1;
  return counts;
};

const hitMetrics = ({
  entry,
  input,
  totalMs,
}: {
  entry: StoredSegments;
  input: SegmentDetectionInput;
  totalMs: number;
}): SportDetectionMetrics => ({
  sport: input.sport,
  cache: 'hit',
  missReason: null,
  sessions: input.sessions.length,
  sessionsWithRecords: 0,
  records: 0,
  tracks: 0,
  resampledPoints: 0,
  segmentsByType: segmentsByTypeOf(entry.segments),
  passes: entry.segments.reduce((total, segment) => total + segment.passes.length, 0),
  engine: null,
  ms: {
    readRecords: 0,
    slowestSessionRead: 0,
    segmentTrack: 0,
    detectedSegments: 0,
    storedSegments: 0,
    saveCache: 0,
    total: totalMs,
  },
});

const detectedEntry = ({
  input,
  reading,
  clockMs,
}: {
  input: SegmentDetectionInput;
  reading: TrackReading;
  clockMs: ClockMs;
}): { entry: StoredSegments; engine: SegmentDetectionStats; detectMs: number; storeMs: number } => {
  const detectStartMs = clockMs();
  const result = segmentDetectionResult({ sport: input.sport, tracks: reading.tracks, clockMs });
  const storeStartMs = clockMs();
  const dateBySessionId = new Map(
    input.sessions.map((session) => [session.sessionId, session.date]),
  );
  const segments = result.segments.map((segment) => storedSegment({ segment, dateBySessionId }));
  const entry: StoredSegments = {
    sport: input.sport,
    sessionsKey: input.sessionsKey,
    detectorVersion: SEGMENT_DETECTOR_VERSION,
    segments: numberedByRecency(segments),
  };
  return {
    entry,
    engine: result.stats,
    detectMs: storeStartMs - detectStartMs,
    storeMs: clockMs() - storeStartMs,
  };
};

export const detectSegmentsForSport = async ({
  ignoreCache = false,
  clockMs = PERFORMANCE_CLOCK_MS,
  ...input
}: SegmentDetectionInput & {
  ignoreCache?: boolean;
  clockMs?: ClockMs;
}): Promise<SportDetection> => {
  const startMs = clockMs();
  const cached = (await getStoredSegments()).find((entry) => entry.sport === input.sport);
  const missReason = missReasonOf({ cached, input, ignoreCache });
  if (cached !== undefined && missReason === null) {
    return {
      entry: cached,
      metrics: hitMetrics({ entry: cached, input, totalMs: clockMs() - startMs }),
    };
  }
  const reading = await tracksOf({ sport: input.sport, sessions: input.sessions, clockMs });
  const detected = detectedEntry({ input, reading, clockMs });
  const saveStartMs = clockMs();
  await saveStoredSegments(detected.entry);
  const saveCacheMs = clockMs() - saveStartMs;
  return {
    entry: detected.entry,
    metrics: {
      sport: input.sport,
      cache: 'miss',
      missReason,
      sessions: input.sessions.length,
      sessionsWithRecords: reading.sessionsWithRecords,
      records: reading.records,
      tracks: reading.tracks.length,
      resampledPoints: reading.resampledPoints,
      segmentsByType: segmentsByTypeOf(detected.entry.segments),
      passes: detected.entry.segments.reduce((total, segment) => total + segment.passes.length, 0),
      engine: detected.engine,
      ms: {
        readRecords: reading.readRecordsMs,
        slowestSessionRead: reading.slowestSessionReadMs,
        segmentTrack: reading.segmentTrackMs,
        detectedSegments: detected.detectMs,
        storedSegments: detected.storeMs,
        saveCache: saveCacheMs,
        total: clockMs() - startMs,
      },
    },
  };
};
