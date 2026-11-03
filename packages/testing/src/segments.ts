import type { DetectedSegment, SegmentPass, SegmentTrack } from '@pacevault/engine/segments.ts';

export const createMockSegmentPass = (overrides?: Partial<SegmentPass>): SegmentPass => ({
  sessionId: 'session-1',
  startTimestampSec: 0,
  endTimestampSec: 300,
  durationSec: 300,
  splitDurationsSec: Array.from({ length: 25 }, (_, split) => split * 12.5),
  coverageRatio: 1,
  ...overrides,
});

export const createMockDetectedSegment = (
  overrides?: Partial<DetectedSegment>,
): DetectedSegment => ({
  sport: 'running',
  type: 'flat',
  leadSessionId: 'session-1',
  startMeters: 0,
  endMeters: 1000,
  distanceMeters: 1000,
  netElevationMeters: 0,
  geometry: [
    [48.137, 11.575],
    [48.146, 11.575],
  ],
  passes: [
    createMockSegmentPass({ sessionId: 'session-1' }),
    createMockSegmentPass({ sessionId: 'session-2', durationSec: 320 }),
  ],
  ...overrides,
});

export const createMockSegmentTrack = (overrides?: Partial<SegmentTrack>): SegmentTrack => ({
  sessionId: 'session-1',
  sport: 'running',
  date: 0,
  points: [],
  climbSpans: [],
  ...overrides,
});
