import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { verifyIntervalsKey } from '@/lib/intervals.ts';
import type { QueryResults } from '@/types.ts';

export const intervalsKeyCheckQueryKey = (options: { apiKey: string }): string[] => [
  'intervals-verify',
  options.apiKey,
];

export const checkIntervalsKey = async (options: {
  apiKey: string;
}): Promise<QueryResults['intervalsKeyCheck']> => {
  await verifyIntervalsKey(options.apiKey);
  return true;
};

export const useIntervalsKeyCheck = (options: {
  apiKey: string;
  savedKey: string | null;
}): UseQueryResult<QueryResults['intervalsKeyCheck']> =>
  useQuery({
    queryKey: intervalsKeyCheckQueryKey({ apiKey: options.apiKey }),
    queryFn: () => checkIntervalsKey({ apiKey: options.apiKey }),
    enabled: options.apiKey !== '' && options.apiKey !== options.savedKey,
    retry: false,
    staleTime: Infinity,
  });
