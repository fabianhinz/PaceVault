import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { getSessionGPS } from '@/lib/storage/db.ts';
import type { QueryResults } from '@/types.ts';

export const loadSessionGps = async (options: {
  sessionId: string;
}): Promise<QueryResults['sessionGps']> => (await getSessionGPS(options.sessionId)) ?? null;

export const sessionGpsQueryKey = (options: { sessionId?: string } = {}): string[] => {
  if (options.sessionId === undefined) return ['session-gps'];
  return ['session-gps', options.sessionId];
};

export const invalidateSessionGps = (queryClient: QueryClient): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: sessionGpsQueryKey() });

export const resetSessionGps = (queryClient: QueryClient): void => {
  queryClient.removeQueries({ queryKey: sessionGpsQueryKey() });
};

export const useSessionGps = (options: {
  sessionId: string;
  enabled: boolean;
}): UseQueryResult<QueryResults['sessionGps']> =>
  useQuery({
    queryKey: sessionGpsQueryKey({ sessionId: options.sessionId }),
    queryFn: () => loadSessionGps({ sessionId: options.sessionId }),
    enabled: options.enabled,
    staleTime: Infinity,
    networkMode: 'always',
  });
