import { useEffect, useState } from 'react';
import { measureStoreBytes, type IdbStoreName } from '@/lib/indexeddb.ts';
import { breakdownStorage, type StorageCategory } from '@/lib/storageBreakdown.ts';

interface StorageBreakdown {
  total: number | null;
  categories: Record<StorageCategory, number> | null;
}

const estimateTotal = async (): Promise<number | null> => {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return estimate.usage ?? null;
};

export const useStorageBreakdown = (refreshKey: unknown): StorageBreakdown => {
  const [estimated, setEstimated] = useState<number | null | undefined>(undefined);
  const [storeBytes, setStoreBytes] = useState<Partial<Record<IdbStoreName, number>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    estimateTotal().then((total) => {
      if (!cancelled) setEstimated(total);
    });
    measureStoreBytes().then((sizes) => {
      if (!cancelled) setStoreBytes(sizes);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  let categories: Record<StorageCategory, number> | null = null;
  if (storeBytes !== null) categories = breakdownStorage(storeBytes, estimated ?? undefined);

  let total: number | null = estimated ?? null;
  if (total === null && categories !== null) {
    total = 0;
    for (const bytes of Object.values(categories)) total += bytes;
  }

  return { total, categories };
};
