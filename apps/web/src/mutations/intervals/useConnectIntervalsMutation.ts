import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { runIntervalsSync } from '@/lib/api/intervalsSync.ts';
import type { IntervalsSyncSummary } from '@/types.ts';
import { intervalsSyncQueryKey } from '@/queries/intervals/useIntervalsSync.ts';

const syncAfterConnect = async (options: {
  queryClient: QueryClient;
  apiKey: string;
}): Promise<IntervalsSyncSummary> => {
  if (options.queryClient.getQueryState(intervalsSyncQueryKey())?.fetchStatus === 'fetching') {
    await options.queryClient
      .fetchQuery({
        queryKey: intervalsSyncQueryKey(),
        queryFn: () =>
          runIntervalsSync({ queryClient: options.queryClient, apiKey: options.apiKey }),
      })
      .catch(() => undefined);
  }
  return options.queryClient.fetchQuery({
    queryKey: intervalsSyncQueryKey(),
    queryFn: () =>
      runIntervalsSync({
        queryClient: options.queryClient,
        apiKey: options.apiKey,
        full: true,
        foreground: true,
      }),
    staleTime: 0,
  });
};

export const useConnectIntervalsMutation = (): UseMutationResult<
  IntervalsSyncSummary,
  Error,
  { apiKey: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => syncAfterConnect({ queryClient, apiKey: variables.apiKey }),
  });
};
