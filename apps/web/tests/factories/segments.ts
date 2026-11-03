import type {
  Segment,
  SegmentSessionMeta,
  StoredSegmentPass,
  StoredSegments,
} from '@/lib/workers/segmentsContract.ts';

export const createMockStoredSegmentPass = (
  overrides?: Partial<StoredSegmentPass>,
): StoredSegmentPass => ({
  sessionId: 'session-1',
  date: 1_767_225_600_000,
  startTimestampSec: 0,
  endTimestampSec: 300,
  durationSec: 300,
  splitDurationsSec: Array.from({ length: 25 }, (_, split) => split * 12.5),
  coverageRatio: 1,
  ...overrides,
});

export const createMockSegment = (overrides?: Partial<Segment>): Segment => ({
  id: 'session-1:0-1000',
  sport: 'running',
  type: 'flat',
  typeNumber: 1,
  distanceMeters: 1000,
  netElevationMeters: 0,
  geometry: [
    [48.137, 11.575],
    [48.146, 11.575],
  ],
  passes: [
    createMockStoredSegmentPass({ sessionId: 'session-1' }),
    createMockStoredSegmentPass({ sessionId: 'session-2', durationSec: 320 }),
  ],
  lastPassDate: 1_767_225_600_000,
  ...overrides,
});

export const createMockStoredSegments = (overrides?: Partial<StoredSegments>): StoredSegments => ({
  sport: 'running',
  sessionsKey: 'key',
  detectorVersion: 1,
  segments: [createMockSegment()],
  ...overrides,
});

export const createMockSegmentSessionMeta = (
  overrides?: Partial<SegmentSessionMeta>,
): SegmentSessionMeta => ({
  sessionId: 'session-1',
  sport: 'running',
  date: 1_767_225_600_000,
  derivationVersion: 1,
  ...overrides,
});
