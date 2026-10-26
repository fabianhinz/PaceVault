import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useSessionsStore } from '@/store/sessions.ts';
import type { PersonalBest, TrainingSession } from '@pacevault/engine/types.ts';
import type { QueryResults } from '@/types.ts';
import type {
  PBSessionMeta,
  WorkerMessageIn,
  WorkerMessageOut,
} from '@/features/records/personalBestsContract.ts';

export const personalBestsQueryKey = (): string[] => ['personal-bests'];

const toPersonalBestSessions = (sessions: TrainingSession[]): PBSessionMeta[] =>
  sessions
    .filter((s) => !s.isPlanned && s.hasDetailedRecords)
    .map((s) => ({
      sessionId: s.id,
      date: s.date,
      sport: s.sport,
      distance: s.distance,
      elevationGain: s.elevationGain,
    }));

export const computePersonalBests = (options: {
  sessions: PBSessionMeta[];
  signal: AbortSignal;
}): Promise<QueryResults['personalBests']> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../../features/records/personalBests.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    );

    options.signal.addEventListener('abort', () => {
      worker.terminate();
      reject(options.signal.reason);
    });

    worker.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
      worker.terminate();
      resolve(e.data.pbs);
    };

    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };

    worker.postMessage({ type: 'compute', sessions: options.sessions } satisfies WorkerMessageIn);
  });
};

export const usePersonalBests = (): UseQueryResult<QueryResults['personalBests']> =>
  useQuery({
    queryKey: personalBestsQueryKey(),
    queryFn: (ctx) =>
      computePersonalBests({
        sessions: toPersonalBestSessions(useSessionsStore.getState().sessions),
        signal: ctx.signal,
      }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const invalidatePersonalBests = (queryClient: QueryClient): Promise<void> => {
  return queryClient.invalidateQueries({ queryKey: personalBestsQueryKey(), refetchType: 'all' });
};

export const invalidatePersonalBestsOfSession = (
  sessionId: string,
  queryClient: QueryClient,
): Promise<void> | undefined => {
  const computing = queryClient.isFetching({ queryKey: personalBestsQueryKey() }) > 0;
  const holdsPB = queryClient
    .getQueryData<PersonalBest[]>(personalBestsQueryKey())
    ?.some((pb) => pb.sessionId === sessionId);
  if (!computing && !holdsPB) return;
  return invalidatePersonalBests(queryClient);
};

export const resetPersonalBests = (queryClient: QueryClient): Promise<void> => {
  return queryClient.resetQueries({ queryKey: personalBestsQueryKey() });
};
