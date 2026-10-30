import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { runIntervalsSync } from '@/lib/api/intervalsSync.ts';
import { MS_PER_MINUTE } from '@pacevault/engine/time.ts';
import type { QueryResults } from '@/types.ts';

export const intervalsSyncQueryKey = (): string[] => ['intervals-sync'];

const POLL_MS = 15 * MS_PER_MINUTE;

export const useIntervalsSync = (): UseQueryResult<QueryResults['intervalsSync']> => {
  const apiKey = useIntervalsStore((s) => s.apiKey);
  const keyInvalid = useIntervalsStore((s) => s.keyInvalid);
  const profilePresent = useUserStore((s) => s.profile !== null);
  const sessionsCurrent = useSessionReprocessingStore(
    (s) => s.phase === 'done' && !s.newerVersionInOtherTab,
  );

  return useQuery({
    queryKey: intervalsSyncQueryKey(),
    queryFn: (ctx) => runIntervalsSync({ queryClient: ctx.client, apiKey, signal: ctx.signal }),
    enabled: apiKey !== null && !keyInvalid && profilePresent && sessionsCurrent,
    refetchInterval: POLL_MS,
    retry: false,
  });
};
