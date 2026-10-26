import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { trainingLoadFtpSignature, trainingLoadHrSignature } from '@/lib/analysis/sessionStress.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { recomputeTrainingLoad } from '@/lib/analysis/recomputeTrainingLoad.ts';
import type { QueryResults } from '@/types.ts';

export const recomputeTrainingLoadOnce = async (): Promise<
  QueryResults['trainingLoadRecompute']
> => {
  try {
    await recomputeTrainingLoad();
    return true;
  } catch (err: unknown) {
    console.error('Recomputing training load failed:', err);
    throw err;
  }
};

export const trainingLoadRecomputeQueryKey = (options: {
  hrSignature: string;
  ftpSignature: string;
}): string[] => ['training-load-recompute', options.hrSignature, options.ftpSignature];

export const useTrainingLoadRecompute = (): UseQueryResult<
  QueryResults['trainingLoadRecompute']
> => {
  const hrSignature = useUserStore((s) => trainingLoadHrSignature(s.profile));
  const ftpSignature = useUserStore((s) => trainingLoadFtpSignature(s.profile));
  const phase = useSessionReprocessingStore((s) => s.phase);
  return useQuery({
    queryKey: trainingLoadRecomputeQueryKey({ hrSignature, ftpSignature }),
    queryFn: recomputeTrainingLoadOnce,
    enabled: phase === 'done',
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    networkMode: 'always',
  });
};
