import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getSessionLaps } from '@/lib/storage/db.ts';
import type { QueryResults } from '@/types.ts';

export const loadSessionLaps = async (options: {
  sessionId: string;
}): Promise<QueryResults['sessionLaps']> => getSessionLaps(options.sessionId);

export const sessionLapsQueryKey = (options: { sessionId?: string } = {}): string[] => {
  if (options.sessionId === undefined) return ['session-laps'];
  return ['session-laps', options.sessionId];
};

export const useSessionLaps = (options: {
  sessionId: string;
  enabled: boolean;
}): UseQueryResult<QueryResults['sessionLaps']> =>
  useQuery({
    queryKey: sessionLapsQueryKey({ sessionId: options.sessionId }),
    queryFn: () => loadSessionLaps({ sessionId: options.sessionId }),
    enabled: options.enabled,
    networkMode: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
