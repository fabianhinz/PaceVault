import { describe, expect, it } from 'vite-plus/test';
import {
  SEGMENT_MATCHER_VERSION,
  segmentPassesEntrySchema,
  workerMessageInSchema,
  workerMessageOutSchema,
} from '@/lib/workers/segmentsContract.ts';
import {
  createMockSegmentPassesEntry,
  createMockSegmentSessionMeta,
} from '@tests/factories/segments.ts';

const metrics = {
  matcherVersion: SEGMENT_MATCHER_VERSION,
  environment: { hardwareConcurrency: 8, deviceMemoryGb: null, userAgent: 'test' },
  workerMs: 12,
  mainThreadMs: null,
  sessionsRead: 2,
  segments: [
    {
      segmentId: 'segment-1',
      cache: 'partial',
      missReason: null,
      sessionsChecked: 1,
      bboxCandidates: 1,
      recordsRead: 2,
      referencePoints: 140,
      passes: 3,
      ms: 4,
    },
  ],
};

describe('workerMessageOutSchema', () => {
  it('accepts a result with and without metrics', () => {
    const entries = [createMockSegmentPassesEntry()];

    expect(workerMessageOutSchema.safeParse({ type: 'done', entries, metrics }).success).toBe(true);
    expect(workerMessageOutSchema.safeParse({ type: 'done', entries }).success).toBe(true);
  });

  it('rejects metrics with an unknown cache state', () => {
    const broken = { ...metrics, segments: [{ ...metrics.segments[0], cache: 'warm' }] };

    expect(
      workerMessageOutSchema.safeParse({ type: 'done', entries: [], metrics: broken }).success,
    ).toBe(false);
  });
});

describe('workerMessageInSchema', () => {
  it('accepts a match request with segments and sessions', () => {
    expect(
      workerMessageInSchema.safeParse({
        type: 'match',
        segments: [
          {
            segmentId: 'segment-1',
            sport: 'running',
            bounds: { minLat: 48, maxLat: 48.1, minLng: 11, maxLng: 11.1 },
            source: { sessionId: 'session-1', startSec: 10, endSec: 400 },
          },
        ],
        sessions: [createMockSegmentSessionMeta()],
      }).success,
    ).toBe(true);
  });

  it('rejects a segment without its source cuts', () => {
    expect(
      workerMessageInSchema.safeParse({
        type: 'match',
        segments: [{ segmentId: 'segment-1', sport: 'running', source: { sessionId: 's' } }],
        sessions: [],
      }).success,
    ).toBe(false);
  });
});

describe('segmentPassesEntrySchema', () => {
  it('rejects an entry without checked session keys', () => {
    const entry = { ...createMockSegmentPassesEntry(), checkedSessionKeys: undefined };

    expect(segmentPassesEntrySchema.safeParse(entry).success).toBe(false);
  });
});
