import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { invalidatePersonalBests } from '@/queries/records/usePersonalBests.ts';
import { invalidateSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { sessionGpsTracksQueryKey } from '@/queries/sessions/useSessionGpsTracks.ts';
import { sessionLapsQueryKey } from '@/queries/sessions/useSessionLaps.ts';
import { sessionRecordsQueryKey } from '@/queries/sessions/useSessionRecords.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { reprocessOutdatedSessions } from '@/lib/analysis/reprocessSessions.ts';
import type { QueryResults } from '@/types.ts';

export const reprocessOutdated = async (options: {
  queryClient: QueryClient;
}): Promise<QueryResults['outdatedSessionsReprocessing']> => {
  try {
    const reprocessed = await reprocessOutdatedSessions();
    if (reprocessed > 0) {
      void invalidatePersonalBests(options.queryClient);
      void invalidateSessionGps(options.queryClient);
      void options.queryClient.invalidateQueries({ queryKey: sessionGpsTracksQueryKey() });
      void options.queryClient.invalidateQueries({ queryKey: sessionRecordsQueryKey() });
      void options.queryClient.invalidateQueries({ queryKey: sessionLapsQueryKey() });
    }
    return reprocessed;
  } catch (err: unknown) {
    console.error('Reprocessing sessions failed:', err);
    throw err;
  }
};

export const outdatedSessionsReprocessingQueryKey = (): string[] => [
  'outdated-sessions-reprocessing',
];

export const useOutdatedSessionsReprocessing = (): UseQueryResult<
  QueryResults['outdatedSessionsReprocessing']
> => {
  const pending = useSessionReprocessingStore((s) => s.phase === 'pending');
  return useQuery({
    queryKey: outdatedSessionsReprocessingQueryKey(),
    queryFn: (ctx) => reprocessOutdated({ queryClient: ctx.client }),
    enabled: pending,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  });
};
