import { useMemo } from 'react';
import { SPORTS, type Sport } from '@pacevault/engine/types.ts';
import { useFiltersStore } from '@/store/filters.ts';

export const useDashboardSports = (): Sport[] => {
  const sportFilter = useFiltersStore((s) => s.activeFilter?.sport ?? null);

  return useMemo(() => {
    if (sportFilter === null) return [...SPORTS];
    return [sportFilter];
  }, [sportFilter]);
};
