import type { IdbStoreName } from './indexeddb.ts';

export type StorageCategory = 'heatmap' | 'fitFiles' | 'weather' | 'appData';

export const STORAGE_CATEGORIES: StorageCategory[] = ['fitFiles', 'heatmap', 'weather', 'appData'];

const STORE_CATEGORIES: [IdbStoreName, StorageCategory][] = [
  ['session-gps', 'heatmap'],
  ['fit-files', 'fitFiles'],
  ['session-weather', 'weather'],
  ['kv', 'appData'],
  ['session-records', 'appData'],
  ['session-laps', 'appData'],
  ['studio-route-points', 'appData'],
];

export const breakdownStorage = (
  storeBytes: Partial<Record<IdbStoreName, number>>,
  totalBytes: number | undefined,
): Record<StorageCategory, number> => {
  const categories: Record<StorageCategory, number> = {
    heatmap: 0,
    fitFiles: 0,
    weather: 0,
    appData: 0,
  };

  let measured = 0;
  for (const [store, category] of STORE_CATEGORIES) {
    const bytes = storeBytes[store] ?? 0;
    categories[category] += bytes;
    measured += bytes;
  }

  if (totalBytes === undefined || measured === 0) return categories;

  const scale = totalBytes / measured;
  for (const category of STORAGE_CATEGORIES) categories[category] *= scale;
  return categories;
};
