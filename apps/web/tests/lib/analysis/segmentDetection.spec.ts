import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { detectSegmentsForSport, segmentsSessionsKey } from '@/lib/analysis/segmentDetection.ts';
import { getSessionRecords, getStoredSegments, saveStoredSegments } from '@/lib/storage/db.ts';
import { segmentDetectionResult, segmentTrack } from '@pacevault/engine/segments.ts';
import { SEGMENT_DETECTOR_VERSION } from '@/lib/workers/segmentsContract.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import {
  createMockDetectedSegment,
  createMockSegmentPass,
  createMockSegmentTrack,
} from '@pacevault/testing/segments.ts';
import {
  createMockSegmentSessionMeta,
  createMockStoredSegments,
} from '@tests/factories/segments.ts';

vi.mock('@/lib/storage/db.ts', () => ({
  getSessionRecords: vi.fn(),
  getStoredSegments: vi.fn(),
  saveStoredSegments: vi.fn(),
}));

vi.mock('@pacevault/engine/segments.ts', () => ({
  segmentDetectionResult: vi.fn(),
  segmentTrack: vi.fn(),
}));

const ENGINE_STATS = {
  leadsProcessed: 2,
  leadsSkippedAsRoute: 0,
  turnAnchors: 1,
  climbAnchors: 0,
  atoms: 3,
  corridorMatches: 6,
  candidates: 3,
  droppedAsDuplicate: 0,
  msByPhase: { grid: 0, corridorMatch: 0, anchors: 0, typing: 0, dedupe: 0 },
};

const detectionOf = (segments: ReturnType<typeof createMockDetectedSegment>[]) => ({
  segments,
  stats: ENGINE_STATS,
});

const SESSIONS = [
  createMockSegmentSessionMeta({ sessionId: 'old', date: 1_000 }),
  createMockSegmentSessionMeta({ sessionId: 'new', date: 2_000 }),
];

describe(detectSegmentsForSport.name, () => {
  beforeEach(() => {
    vi.mocked(getSessionRecords).mockResolvedValue([]);
    vi.mocked(getStoredSegments).mockResolvedValue([]);
    vi.mocked(saveStoredSegments).mockResolvedValue();
    vi.mocked(segmentTrack).mockReturnValue(createMockSegmentTrack());
    vi.mocked(segmentDetectionResult).mockReturnValue(detectionOf([]));
  });

  it('returns the stored entry without reading records when key and version match', async () => {
    const stored = createMockStoredSegments({
      sessionsKey: segmentsSessionsKey(SESSIONS),
      detectorVersion: SEGMENT_DETECTOR_VERSION,
    });
    vi.mocked(getStoredSegments).mockResolvedValue([stored]);

    const detection = await detectSegmentsForSport({
      sport: 'running',
      sessionsKey: segmentsSessionsKey(SESSIONS),
      sessions: SESSIONS,
    });

    expect(detection.entry).toEqual(stored);
    expect(detection.metrics.cache).toBe('hit');
    expect(detection.metrics.missReason).toBe(null);
    expect(detection.metrics.segmentsByType).toEqual({ climb: 0, flat: 1, descent: 0, route: 0 });
    expect(detection.metrics.passes).toBe(2);
    expect(getSessionRecords).not.toHaveBeenCalled();
    expect(saveStoredSegments).not.toHaveBeenCalled();
  });

  it('detects again and saves when the sessions key changed', async () => {
    vi.mocked(getStoredSegments).mockResolvedValue([
      createMockStoredSegments({ sessionsKey: 'stale', detectorVersion: SEGMENT_DETECTOR_VERSION }),
    ]);

    const detection = await detectSegmentsForSport({
      sport: 'running',
      sessionsKey: 'fresh',
      sessions: SESSIONS,
    });

    expect(getSessionRecords).toHaveBeenCalledWith('old');
    expect(getSessionRecords).toHaveBeenCalledWith('new');
    expect(saveStoredSegments).toHaveBeenCalledWith(detection.entry);
    expect(detection.entry.sessionsKey).toBe('fresh');
    expect(detection.metrics.cache).toBe('miss');
    expect(detection.metrics.missReason).toBe('sessionsKey');
    expect(detection.metrics.engine).toEqual(ENGINE_STATS);
  });

  it('detects again when the detector version changed', async () => {
    const sessionsKey = segmentsSessionsKey(SESSIONS);
    vi.mocked(getStoredSegments).mockResolvedValue([
      createMockStoredSegments({ sessionsKey, detectorVersion: SEGMENT_DETECTOR_VERSION - 1 }),
    ]);

    const detection = await detectSegmentsForSport({
      sport: 'running',
      sessionsKey,
      sessions: SESSIONS,
    });

    expect(detection.entry.detectorVersion).toBe(SEGMENT_DETECTOR_VERSION);
    expect(saveStoredSegments).toHaveBeenCalledWith(detection.entry);
    expect(detection.metrics.missReason).toBe('detectorVersion');
  });

  it('builds ids from the lead and numbers each type by recency', async () => {
    vi.mocked(segmentDetectionResult).mockReturnValue(
      detectionOf([
        createMockDetectedSegment({
          leadSessionId: 'old',
          startMeters: 0,
          endMeters: 1200.4,
          passes: [createMockSegmentPass({ sessionId: 'old' })],
        }),
        createMockDetectedSegment({
          leadSessionId: 'new',
          startMeters: 500,
          endMeters: 1500,
          passes: [createMockSegmentPass({ sessionId: 'new' })],
        }),
        createMockDetectedSegment({
          type: 'climb',
          leadSessionId: 'old',
          startMeters: 2000,
          endMeters: 2600,
          passes: [createMockSegmentPass({ sessionId: 'old' })],
        }),
      ]),
    );

    const detection = await detectSegmentsForSport({
      sport: 'running',
      sessionsKey: 'fresh',
      sessions: SESSIONS,
    });

    expect(
      detection.entry.segments.map((segment) => [segment.id, segment.type, segment.typeNumber]),
    ).toEqual([
      ['new:500-1500', 'flat', 1],
      ['old:0-1200', 'flat', 2],
      ['old:2000-2600', 'climb', 1],
    ]);
  });

  it('detects again with a forced miss and counts records, tracks and passes', async () => {
    const sessionsKey = segmentsSessionsKey(SESSIONS);
    vi.mocked(getStoredSegments).mockResolvedValue([
      createMockStoredSegments({ sessionsKey, detectorVersion: SEGMENT_DETECTOR_VERSION }),
    ]);
    vi.mocked(getSessionRecords).mockResolvedValue([createMockSessionRecord()]);

    const detection = await detectSegmentsForSport({
      sport: 'running',
      sessionsKey,
      sessions: SESSIONS,
      ignoreCache: true,
    });

    expect(detection.metrics.missReason).toBe('forced');
    expect(detection.metrics.sessionsWithRecords).toBe(2);
    expect(detection.metrics.records).toBe(2);
    expect(detection.metrics.tracks).toBe(2);
  });
});
