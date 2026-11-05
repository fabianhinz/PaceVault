import type { SessionGPS, SessionRecord } from '@pacevault/engine/types.ts';
import { getAllSessionGPS } from '@/lib/storage/db.ts';
import { matchSegment } from '@/lib/analysis/segmentMatching.ts';
import {
  SEGMENT_MATCHER_VERSION,
  workerMessageInSchema,
  type SegmentMatchingMetrics,
  type SegmentMatchMetrics,
  type SegmentPassesEntry,
  type WorkerMessageOut,
} from './segmentsContract.ts';

const environment = (): SegmentMatchingMetrics['environment'] => {
  let deviceMemoryGb: number | null = null;
  if ('deviceMemory' in navigator && typeof navigator.deviceMemory === 'number') {
    deviceMemoryGb = navigator.deviceMemory;
  }
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb,
    userAgent: navigator.userAgent,
  };
};

const gpsBySessionIdOf = async (): Promise<Map<string, SessionGPS>> => {
  const all = await getAllSessionGPS().catch((): SessionGPS[] => []);
  return new Map(all.map((gps) => [gps.sessionId, gps]));
};

self.onmessage = async (event: MessageEvent<unknown>) => {
  const startMs = performance.now();
  const parsed = workerMessageInSchema.safeParse(event.data);
  const entries: SegmentPassesEntry[] = [];
  const segments: SegmentMatchMetrics[] = [];
  const records = new Map<string, SessionRecord[]>();
  if (parsed.success && parsed.data.segments.length > 0) {
    const gpsBySessionId = await gpsBySessionIdOf();
    const ignoreCache = parsed.data.ignoreCache === true;
    for (const segment of parsed.data.segments) {
      const match = await matchSegment({
        segment,
        sessions: parsed.data.sessions,
        gpsBySessionId,
        records,
        ignoreCache,
      });
      entries.push(match.entry);
      segments.push(match.metrics);
    }
  }
  const metrics: SegmentMatchingMetrics = {
    matcherVersion: SEGMENT_MATCHER_VERSION,
    environment: environment(),
    workerMs: performance.now() - startMs,
    mainThreadMs: null,
    sessionsRead: records.size,
    segments,
  };
  self.postMessage({ type: 'done', entries, metrics } satisfies WorkerMessageOut);
};
