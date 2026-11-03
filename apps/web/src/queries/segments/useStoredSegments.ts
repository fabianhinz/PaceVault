import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { getStoredSegments } from '@/lib/storage/db.ts';
import type { QueryResults } from '@/types.ts';

export const loadStoredSegments = (): Promise<QueryResults['storedSegments']> =>
  getStoredSegments();

export const storedSegmentsQueryKey = (): string[] => ['stored-segments'];

export const useStoredSegments = (options: {
  enabled: boolean;
}): UseQueryResult<QueryResults['storedSegments']> =>
  useQuery({
    queryKey: storedSegmentsQueryKey(),
    queryFn: loadStoredSegments,
    enabled: options.enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: 'always',
  });

export const resetStoredSegments = (queryClient: QueryClient): Promise<void> =>
  queryClient.resetQueries({ queryKey: storedSegmentsQueryKey() });
