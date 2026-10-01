import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useSessionsStore } from '@/store/sessions.ts';
import type { PersonalBest } from '@/packages/engine/types.ts';
import type {
  PBSessionMeta,
  WorkerMessageIn,
  WorkerMessageOut,
} from '@/features/records/personalBests.worker.ts';

export const PERSONAL_BESTS_KEY = ['personal-bests'];

const computePersonalBests = (signal: AbortSignal): Promise<PersonalBest[]> => {
  const sessions: PBSessionMeta[] = useSessionsStore
    .getState()
    .sessions.filter((s) => !s.isPlanned && s.hasDetailedRecords)
    .map((s) => ({
      sessionId: s.id,
      date: s.date,
      sport: s.sport,
      distance: s.distance,
      elevationGain: s.elevationGain,
    }));

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../personalBests.worker.ts', import.meta.url), {
      type: 'module',
    });

    signal.addEventListener('abort', () => {
      worker.terminate();
      reject(signal.reason);
    });

    worker.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
      worker.terminate();
      resolve(e.data.pbs);
    };

    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };

    worker.postMessage({ type: 'compute', sessions } satisfies WorkerMessageIn);
  });
};

export const usePersonalBests = () => {
  return useQuery({
    queryKey: PERSONAL_BESTS_KEY,
    queryFn: (ctx) => computePersonalBests(ctx.signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const invalidatePersonalBests = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({ queryKey: PERSONAL_BESTS_KEY, refetchType: 'all' });
};

export const invalidatePersonalBestsOfSession = (queryClient: QueryClient, sessionId: string) => {
  const computing = queryClient.isFetching({ queryKey: PERSONAL_BESTS_KEY }) > 0;
  const holdsPB = queryClient
    .getQueryData<PersonalBest[]>(PERSONAL_BESTS_KEY)
    ?.some((pb) => pb.sessionId === sessionId);
  if (!computing && !holdsPB) return;
  return invalidatePersonalBests(queryClient);
};

export const resetPersonalBests = (queryClient: QueryClient) => {
  return queryClient.resetQueries({ queryKey: PERSONAL_BESTS_KEY });
};
