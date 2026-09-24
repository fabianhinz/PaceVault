import { useQuery } from '@tanstack/react-query';
import { verifyIntervalsKey } from '@/lib/intervals.ts';

export const intervalsVerifyQueryKey = (apiKey: string) => ['intervals-verify', apiKey];

export const verifyIntervalsKeyOrThrow = async (apiKey: string) => {
  const result = await verifyIntervalsKey(apiKey);
  if (!result.ok) throw new Error(result.code);
  return result.data;
};

export const useIntervalsKeyCheck = (apiKey: string, savedKey: string | null) => {
  return useQuery({
    queryKey: intervalsVerifyQueryKey(apiKey),
    queryFn: () => verifyIntervalsKeyOrThrow(apiKey),
    enabled: apiKey !== '' && apiKey !== savedKey,
    retry: false,
    staleTime: Infinity,
  });
};
