import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { measureStoreBytes } from '@/lib/db.ts';
import { breakdownStorage, type StorageCategory } from '@/lib/storageBreakdown.ts';
import type { QueryResults } from '@/types.ts';

export interface StorageBreakdown {
  total: number | null;
  categories: Record<StorageCategory, number> | null;
}

const estimateStorageUsage = async (): Promise<number | null> => {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return estimate.usage ?? null;
};

export const measureStorageBreakdown = async (): Promise<QueryResults['storageBreakdown']> => {
  const measured = await Promise.all([estimateStorageUsage(), measureStoreBytes()]);
  const estimated = measured[0];
  const categories = breakdownStorage({
    storeBytes: measured[1],
    totalBytes: estimated ?? undefined,
  });

  let total: number | null = estimated;
  if (total === null) {
    total = 0;
    for (const bytes of Object.values(categories)) total += bytes;
  }

  return { total, categories };
};

export const storageBreakdownQueryKey = (options: {
  sessionCount: number;
}): (string | number)[] => ['storage-breakdown', options.sessionCount];

export const useStorageBreakdown = (options: {
  sessionCount: number;
}): UseQueryResult<QueryResults['storageBreakdown']> =>
  useQuery({
    queryKey: storageBreakdownQueryKey(options),
    queryFn: measureStorageBreakdown,
    staleTime: 0,
    networkMode: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
