import type {
  SegmentPass,
  SegmentReferencePoint,
  SegmentTrack,
} from '@pacevault/engine/segments.ts';

export const createMockSegmentPass = (overrides?: Partial<SegmentPass>): SegmentPass => ({
  sessionId: 'session-1',
  startTimestampSec: 0,
  endTimestampSec: 300,
  durationSec: 300,
  coverageRatio: 1,
  ...overrides,
});

export const createMockSegmentTrack = (overrides?: Partial<SegmentTrack>): SegmentTrack => ({
  sessionId: 'session-1',
  sport: 'running',
  date: 0,
  points: [],
  ...overrides,
});

export const createMockSegmentReferencePoint = (
  overrides?: Partial<SegmentReferencePoint>,
): SegmentReferencePoint => ({
  lat: 48.137,
  lng: 11.575,
  distanceMeters: 0,
  elevationMeters: 300,
  ...overrides,
});
