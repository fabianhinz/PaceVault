import type { Segment } from '@/store/segments.ts';
import type {
  SegmentPassesEntry,
  SegmentSessionMeta,
  StoredSegmentPass,
} from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import type { PassSeries } from '@/components/segments/charts/segmentChartRows.ts';

export const createMockStoredSegmentPass = (
  overrides?: Partial<StoredSegmentPass>,
): StoredSegmentPass => ({
  sessionId: 'session-1',
  date: 1_767_225_600_000,
  startTimestampSec: 0,
  endTimestampSec: 300,
  durationSec: 300,
  coverageRatio: 1,
  ...overrides,
});

export const createMockSegment = (overrides?: Partial<Segment>): Segment => ({
  id: 'segment-1',
  name: 'Morning Run · km 0.0–1.0',
  sport: 'running',
  source: { sessionId: 'session-1', kind: 'range', startSec: 0, endSec: 300 },
  distanceMeters: 1000,
  netElevationMeters: 0,
  encodedPolyline: 'gwxdHwvseAgw@?',
  bounds: { minLat: 48.137, maxLat: 48.146, minLng: 11.575, maxLng: 11.575 },
  createdAt: 1_767_225_600_000,
  ...overrides,
});

export const createMockMatchedSegment = (overrides?: Partial<MatchedSegment>): MatchedSegment => ({
  ...createMockSegment(),
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

export const createMockSegmentPassesEntry = (
  overrides?: Partial<SegmentPassesEntry>,
): SegmentPassesEntry => ({
  segmentId: 'segment-1',
  matcherVersion: 1,
  sourceSessionKey: 'session-1@1',
  checkedSessionKeys: ['session-1@1'],
  passes: [createMockStoredSegmentPass()],
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

export const createMockPassSeries = (overrides?: Partial<PassSeries>): PassSeries => ({
  elapsedSec: [0, 10],
  positions: [
    [48.137, 11.575],
    [48.146, 11.575],
  ],
  values: {
    hr: [],
    power: [],
    speed: [],
    pace: [],
    gap: [],
    elevation: [],
    grade: [],
    cadence: [],
  },
  ...overrides,
});
