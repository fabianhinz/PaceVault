import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getSessionRecords } from '@/lib/db.ts';
import type { QueryResults } from '@/types.ts';

export const loadSessionRecords = async (options: {
  sessionId: string;
}): Promise<QueryResults['sessionRecords']> => getSessionRecords(options.sessionId);

export const sessionRecordsQueryKey = (options: { sessionId: string }): string[] => [
  'session-records',
  options.sessionId,
];

export const useSessionRecords = (options: {
  sessionId: string;
  enabled: boolean;
}): UseQueryResult<QueryResults['sessionRecords']> =>
  useQuery({
    queryKey: sessionRecordsQueryKey({ sessionId: options.sessionId }),
    queryFn: () => loadSessionRecords({ sessionId: options.sessionId }),
    enabled: options.enabled,
    networkMode: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
