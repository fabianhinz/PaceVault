import { describe, expect, it } from 'vite-plus/test';
import {
  SEGMENT_DETECTOR_VERSION,
  workerMessageOutSchema,
} from '@/lib/workers/segmentsContract.ts';
import { createMockStoredSegments } from '@tests/factories/segments.ts';

const metrics = {
  detectorVersion: SEGMENT_DETECTOR_VERSION,
  environment: { hardwareConcurrency: 8, deviceMemoryGb: null, userAgent: 'test' },
  workerMs: 12,
  mainThreadMs: null,
  sports: [
    {
      sport: 'running',
      cache: 'hit',
      missReason: null,
      sessions: 3,
      sessionsWithRecords: 0,
      records: 0,
      tracks: 0,
      resampledPoints: 0,
      segmentsByType: { climb: 0, flat: 1, descent: 0, route: 0 },
      passes: 2,
      engine: null,
      ms: {
        readRecords: 0,
        slowestSessionRead: 0,
        segmentTrack: 0,
        detectedSegments: 0,
        storedSegments: 0,
        saveCache: 0,
        total: 1,
      },
    },
  ],
};

describe('workerMessageOutSchema', () => {
  it('accepts a result with and without metrics', () => {
    const entries = [createMockStoredSegments()];

    expect(workerMessageOutSchema.safeParse({ type: 'done', entries, metrics }).success).toBe(true);
    expect(workerMessageOutSchema.safeParse({ type: 'done', entries }).success).toBe(true);
  });

  it('rejects metrics with an unknown cache state', () => {
    const broken = { ...metrics, sports: [{ ...metrics.sports[0], cache: 'warm' }] };

    expect(
      workerMessageOutSchema.safeParse({ type: 'done', entries: [], metrics: broken }).success,
    ).toBe(false);
  });
});
