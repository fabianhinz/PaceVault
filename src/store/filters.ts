import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 } from 'uuid';
import { z } from 'zod';
import { idbStorage } from '@/lib/idbStorage.ts';
import {
  type FilterCriteria,
  type SavedFilter,
  createDefaultSavedFilters,
  emptyCriteria,
  filterKey,
} from '@/lib/savedFilters.ts';
import type { LoadGroupBy } from '@/lib/loadAxis.ts';
import type { VolumeMetric } from '@/lib/dashboardVolume.ts';

interface FiltersState {
  savedFilters: SavedFilter[];
  activeFilter: FilterCriteria | null;
  loadChartGroupBy: LoadGroupBy;
  volumeChartMetric: VolumeMetric;
  toggleSavedFilter: (id: string) => void;
  saveBuilderFilter: (criteria: FilterCriteria) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearActiveFilter: () => void;
  resetFilters: () => void;
  setLoadChartGroupBy: (groupBy: LoadGroupBy) => void;
  setVolumeChartMetric: (metric: VolumeMetric) => void;
}

type PersistedFilters = Pick<
  FiltersState,
  'savedFilters' | 'activeFilter' | 'loadChartGroupBy' | 'volumeChartMetric'
>;

const SAVED_FILTERS_LIMIT = 15;

const groupBySchema = z.object({ loadChartGroupBy: z.enum(['day', 'week', 'month']) });

export const migrateFilters = (persistedState: unknown, fromVersion: number): PersistedFilters => {
  const migrated: PersistedFilters = {
    savedFilters: createDefaultSavedFilters(),
    activeFilter: null,
    loadChartGroupBy: 'week',
    volumeChartMetric: 'distance',
  };
  if (fromVersion < 2) {
    return migrated;
  }
  const groupBy = groupBySchema.safeParse(persistedState);
  if (groupBy.success) {
    migrated.loadChartGroupBy = groupBy.data.loadChartGroupBy;
  }
  return migrated;
};

export const useFiltersStore = create<FiltersState>()(
  immer(
    persist(
      (set, get) => ({
        savedFilters: createDefaultSavedFilters(),
        activeFilter: null,
        loadChartGroupBy: 'week',
        volumeChartMetric: 'distance',
        toggleSavedFilter: (id) => {
          const state = get();
          const filter = state.savedFilters.find((f) => f.id === id);
          if (!filter) {
            return;
          }
          if (state.activeFilter && filterKey(state.activeFilter) === filterKey(filter.criteria)) {
            set({ activeFilter: null });
            return;
          }
          set({ activeFilter: filter.criteria });
        },
        saveBuilderFilter: (criteria) => {
          set((draft) => {
            draft.activeFilter = structuredClone(criteria);
            const key = filterKey(criteria);
            if (draft.savedFilters.some((f) => filterKey(f.criteria) === key)) {
              return;
            }
            draft.savedFilters.unshift({ id: v4(), criteria: structuredClone(criteria) });
            draft.savedFilters.splice(SAVED_FILTERS_LIMIT);
          });
        },
        setDashboardChartRange: (from, to) => {
          set((draft) => {
            const active = draft.activeFilter ?? emptyCriteria();
            active.time = { kind: 'range', from, to, source: 'zoom' };
            draft.activeFilter = active;
          });
        },
        clearActiveFilter: () => {
          set({ activeFilter: null });
        },
        resetFilters: () => {
          set({
            savedFilters: createDefaultSavedFilters(),
            activeFilter: null,
          });
        },
        setLoadChartGroupBy: (loadChartGroupBy) => {
          set({ loadChartGroupBy });
        },
        setVolumeChartMetric: (volumeChartMetric) => {
          set({ volumeChartMetric });
        },
      }),
      {
        name: 'store-filters',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 3,
        migrate: (persistedState, fromVersion) =>
          migrateFilters(persistedState, fromVersion) as FiltersState,
        partialize: (state): PersistedFilters => ({
          savedFilters: state.savedFilters,
          activeFilter: state.activeFilter,
          loadChartGroupBy: state.loadChartGroupBy,
          volumeChartMetric: state.volumeChartMetric,
        }),
      },
    ),
  ),
);
