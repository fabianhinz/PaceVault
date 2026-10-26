import { useMemo } from 'react';
import {
  keepPreviousData,
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { getAllSessionGPS } from '@/lib/db.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingActive } from '@/features/sessions/hooks/useSessionReprocessingActive.ts';
import { invalidateSessionGps } from '@/queries/sessions/useSessionGps.ts';
import type { WorkerMessageIn } from '@/features/map/gpsBuildContract.ts';
import type { QueryResults } from '@/types.ts';

const buildMissingGps = (options: {
  missingIds: string[];
  signal: AbortSignal;
}): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../features/map/gpsBuild.worker.ts', import.meta.url), {
      type: 'module',
    });
    options.signal.addEventListener('abort', () => {
      worker.terminate();
      reject(options.signal.reason);
    });
    worker.onmessage = () => {
      worker.terminate();
      resolve(true);
    };
    worker.onerror = () => {
      worker.terminate();
      resolve(false);
    };
    worker.postMessage({
      type: 'build',
      sessionIds: options.missingIds,
    } satisfies WorkerMessageIn);
  });

export const loadSessionGpsTracks = async (options: {
  detailedSessionIds: string[];
  signal: AbortSignal;
  queryClient: QueryClient;
  onSettled: () => void;
}): Promise<QueryResults['sessionGpsTracks']> => {
  const existingGps = await getAllSessionGPS();
  options.signal.throwIfAborted();
  const processedIds = new Set(existingGps.map((gps) => gps.sessionId));
  const missingIds = options.detailedSessionIds.filter((id) => !processedIds.has(id));
  if (missingIds.length === 0) {
    options.onSettled();
    return existingGps;
  }

  const built = await buildMissingGps({ missingIds, signal: options.signal });
  if (!built) {
    options.onSettled();
    return existingGps;
  }
  const gps = await getAllSessionGPS();
  options.signal.throwIfAborted();
  void invalidateSessionGps(options.queryClient);
  options.onSettled();
  return gps;
};

export const sessionGpsTracksQueryKey = (options: { detailedSessionIds: string[] }): string[] => [
  'session-gps-tracks',
  options.detailedSessionIds.join(','),
];

export const useSessionGpsTracks = (): UseQueryResult<QueryResults['sessionGpsTracks']> => {
  const sessions = useSessionsStore((s) => s.sessions);
  const importing = useImportProgressStore((s) => s.runningImports > 0);
  const reprocessing = useSessionReprocessingActive();
  const detailedSessionIds = useMemo(
    () =>
      sessions
        .filter((s) => s.hasDetailedRecords)
        .map((s) => s.id)
        .sort(),
    [sessions],
  );

  return useQuery({
    queryKey: sessionGpsTracksQueryKey({ detailedSessionIds }),
    queryFn: (ctx) =>
      loadSessionGpsTracks({
        detailedSessionIds,
        signal: ctx.signal,
        queryClient: ctx.client,
        onSettled: () => useImportProgressStore.getState().finishTrackBuild(),
      }),
    enabled: !importing && !reprocessing,
    staleTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    networkMode: 'always',
    retry: false,
  });
};
