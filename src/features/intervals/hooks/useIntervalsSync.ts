import { useQuery } from '@tanstack/react-query';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { runIntervalsSync } from '../runIntervalsSync.ts';

export const INTERVALS_SYNC_KEY = ['intervals-sync'];

const POLL_MS = 15 * 60_000;

export const useIntervalsSync = () => {
  const apiKey = useIntervalsStore((s) => s.apiKey);
  const keyInvalid = useIntervalsStore((s) => s.keyInvalid);
  const hasProfile = useUserStore((s) => s.profile !== null);
  const sessionsCurrent = useSessionReprocessingStore(
    (s) => s.phase === 'done' && !s.newerVersionInOtherTab,
  );

  return useQuery({
    queryKey: INTERVALS_SYNC_KEY,
    queryFn: (ctx) => runIntervalsSync({ queryClient: ctx.client }),
    enabled: apiKey !== null && !keyInvalid && hasProfile && sessionsCurrent,
    refetchInterval: POLL_MS,
    retry: false,
  });
};
