import { useMemo } from 'react';
import {
  keepPreviousData,
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useSessionsStore } from '@/store/sessions.ts';
import { segmentDetectionInputs } from '@/lib/analysis/segmentDetection.ts';
import type { QueryResults } from '@/types.ts';
import type {
  SegmentDetectionInput,
  WorkerMessageIn,
  WorkerMessageOut,
} from '@/lib/workers/segmentsContract.ts';
import { reportSegmentMetrics, segmentDebugMode } from '@/lib/debug/segmentMetrics.ts';

export const detectSegments = (options: {
  sports: SegmentDetectionInput[];
  signal: AbortSignal;
}): Promise<QueryResults['detectedSegments']> =>
  new Promise((resolve, reject) => {
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
      type: 'detect',
      sports: options.sports,
      ignoreCache: segmentDebugMode() === 'cold',
    } satisfies WorkerMessageIn);
  });

export const detectedSegmentsQueryKey = (options: { sessionsKeys?: string[] } = {}): string[] => {
  if (options.sessionsKeys === undefined) return ['detected-segments'];
  return ['detected-segments', ...options.sessionsKeys];
};

export const useDetectedSegments = (options: {
  enabled: boolean;
}): UseQueryResult<QueryResults['detectedSegments']> => {
  const sessions = useSessionsStore((s) => s.sessions);
  const inputs = useMemo(() => segmentDetectionInputs(sessions), [sessions]);
  return useQuery({
    queryKey: detectedSegmentsQueryKey({ sessionsKeys: inputs.map((input) => input.sessionsKey) }),
    queryFn: (ctx) => detectSegments({ sports: inputs, signal: ctx.signal }),
    enabled: options.enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: 'always',
  });
};

export const resetDetectedSegments = (queryClient: QueryClient): Promise<void> =>
  queryClient.resetQueries({ queryKey: detectedSegmentsQueryKey() });
