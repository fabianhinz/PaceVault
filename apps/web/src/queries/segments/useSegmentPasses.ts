import { useMemo } from 'react';
import {
  keepPreviousData,
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { segmentMatchSessions, sessionsKeyBySport } from '@/lib/analysis/segmentMatching.ts';
import { reportSegmentMetrics, segmentDebugMode } from '@/lib/debug/segmentMetrics.ts';
import type { QueryResults } from '@/types.ts';
import {
  SEGMENT_MATCHER_VERSION,
  type SegmentMatchInput,
  type SegmentSessionMeta,
  type WorkerMessageIn,
  type WorkerMessageOut,
} from '@/lib/workers/segmentsContract.ts';

const SEGMENT_PASSES_QUERY_ROOT = 'segment-passes';

const matchInputOf = (segment: Segment): SegmentMatchInput => ({
  segmentId: segment.id,
  sport: segment.sport,
  bounds: segment.bounds,
  source: {
    sessionId: segment.source.sessionId,
    startSec: segment.source.startSec,
    endSec: segment.source.endSec,
  },
});

export const matchSegmentPasses = (options: {
  segments: SegmentMatchInput[];
  sessions: SegmentSessionMeta[];
  signal: AbortSignal;
}): Promise<QueryResults['segmentPasses']> =>
  new Promise((resolve, reject) => {
    if (options.segments.length === 0) {
      resolve([]);
      return;
    }
    const startMs = performance.now();
    const worker = new Worker(new URL('../../lib/workers/segments.worker.ts', import.meta.url), {
      type: 'module',
    });

    options.signal.addEventListener('abort', () => {
      worker.terminate();
      reject(options.signal.reason);
    });

    worker.onmessage = (event: MessageEvent<WorkerMessageOut>) => {
      worker.terminate();
      const metrics = event.data.metrics;
      if (metrics !== undefined) {
        reportSegmentMetrics({ ...metrics, mainThreadMs: performance.now() - startMs });
      }
      resolve(event.data.entries);
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(event);
    };

    worker.postMessage({
      type: 'match',
      segments: options.segments,
      sessions: options.sessions,
      ignoreCache: segmentDebugMode() === 'cold',
    } satisfies WorkerMessageIn);
  });

export const segmentPassesQueryKey = (
  options: { segmentIds?: string[]; sessionsKeys?: string[] } = {},
): string[] => {
  if (options.segmentIds === undefined || options.sessionsKeys === undefined) {
    return [SEGMENT_PASSES_QUERY_ROOT];
  }
  return [
    SEGMENT_PASSES_QUERY_ROOT,
    String(SEGMENT_MATCHER_VERSION),
    [...options.segmentIds].sort().join(','),
    ...options.sessionsKeys,
  ];
};

export const useSegmentPasses = (options: {
  enabled: boolean;
}): UseQueryResult<QueryResults['segmentPasses']> => {
  const sessions = useSessionsStore((s) => s.sessions);
  const segments = useSegmentsStore((s) => s.segments);
  const sessionMetas = useMemo(() => segmentMatchSessions(sessions), [sessions]);
  const inputs = useMemo(() => segments.map(matchInputOf), [segments]);
  const sessionsKeys = useMemo(
    () => Object.values(sessionsKeyBySport(sessionMetas)),
    [sessionMetas],
  );
  return useQuery({
    queryKey: segmentPassesQueryKey({
      segmentIds: inputs.map((input) => input.segmentId),
      sessionsKeys,
    }),
    queryFn: (ctx) =>
      matchSegmentPasses({ segments: inputs, sessions: sessionMetas, signal: ctx.signal }),
    enabled: options.enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: 'always',
  });
};

export const resetSegmentPasses = (queryClient: QueryClient): Promise<void> =>
  queryClient.resetQueries({ queryKey: segmentPassesQueryKey() });
