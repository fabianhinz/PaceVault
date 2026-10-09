import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 } from 'uuid';
import { z } from 'zod';
import { idbStorage } from '@/lib/idbStorage.ts';
import { type FilterTime, isZoomTime } from '@/lib/timeRange.ts';
import {
  type FilterCriteria,
  type SavedFilter,
  createDefaultSavedFilters,
  emptyCriteria,
  filterKey,
  isEmptyCriteria,
} from '@/lib/savedFilters.ts';
import type { LoadGroupBy } from '@/lib/loadAxis.ts';
import type { VolumeMetric } from '@/lib/dashboardVolume.ts';
import { SPORTS } from '@/packages/engine/types.ts';

interface FiltersState {
  savedFilters: SavedFilter[];
  activeFilter: FilterCriteria | null;
  zoomRestoreTime: FilterTime | null;
  loadChartGroupBy: LoadGroupBy;
  volumeChartMetric: VolumeMetric;
  toggleSavedFilter: (id: string) => void;
  saveBuilderFilter: (criteria: FilterCriteria, editingId: string | null) => void;
  deleteSavedFilter: (id: string) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearDashboardChartRange: () => void;
  resetFilters: () => void;
  setLoadChartGroupBy: (groupBy: LoadGroupBy) => void;
  setVolumeChartMetric: (metric: VolumeMetric) => void;
}

type PersistedFilters = Pick<
  FiltersState,
  'savedFilters' | 'activeFilter' | 'zoomRestoreTime' | 'loadChartGroupBy' | 'volumeChartMetric'
>;

const filterTimeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('relative'),
    amount: z.number(),
    unit: z.enum(['day', 'week', 'month']),
  }),
  z.object({ kind: z.literal('calendarYear'), yearsAgo: z.number() }),
  z.object({
    kind: z.literal('range'),
    from: z.string(),
    to: z.string(),
    source: z.enum(['year', 'month', 'months', 'zoom']),
  }),
]);

const filterCriteriaSchema = z.object({
  sport: z.enum(SPORTS).nullable(),
  time: filterTimeSchema.nullable(),
  distance: z.number().nullable(),
  duration: z.number().nullable(),
  elevationGain: z.number().nullable(),
});

const v3FiltersSchema = z.object({
  savedFilters: z.array(z.object({ id: z.string(), criteria: filterCriteriaSchema })),
  activeFilter: filterCriteriaSchema.nullable(),
  zoomRestoreTime: filterTimeSchema.nullable(),
});

const groupBySchema = z.object({ loadChartGroupBy: z.enum(['day', 'week', 'month']) });

export const migrateFilters = (persistedState: unknown, fromVersion: number): PersistedFilters => {
  const migrated: PersistedFilters = {
    savedFilters: createDefaultSavedFilters(),
    activeFilter: null,
    zoomRestoreTime: null,
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
  if (fromVersion < 3) {
    return migrated;
  }
  const filters = v3FiltersSchema.safeParse(persistedState);
  if (filters.success) {
    migrated.savedFilters = filters.data.savedFilters;
    migrated.activeFilter = filters.data.activeFilter;
    migrated.zoomRestoreTime = filters.data.zoomRestoreTime;
  }
  return migrated;
};

export const useFiltersStore = create<FiltersState>()(
  immer(
    persist(
      (set, get) => ({
        savedFilters: createDefaultSavedFilters(),
        activeFilter: null,
        zoomRestoreTime: null,
        loadChartGroupBy: 'month',
        volumeChartMetric: 'distance',
        toggleSavedFilter: (id) => {
          const state = get();
          const filter = state.savedFilters.find((f) => f.id === id);
          if (!filter) {
            return;
          }
          if (state.activeFilter && filterKey(state.activeFilter) === filterKey(filter.criteria)) {
            set({ activeFilter: null, zoomRestoreTime: null });
            return;
          }
          set({ activeFilter: filter.criteria, zoomRestoreTime: null });
        },
        saveBuilderFilter: (criteria, editingId) => {
          set((draft) => {
            draft.zoomRestoreTime = null;
            draft.activeFilter = structuredClone(criteria);
            const key = filterKey(criteria);
            if (draft.savedFilters.some((f) => filterKey(f.criteria) === key)) {
              return;
            }
            const edited = draft.savedFilters.find((f) => f.id === editingId);
            if (edited) {
              edited.criteria = structuredClone(criteria);
              return;
            }
            draft.savedFilters.push({ id: v4(), criteria: structuredClone(criteria) });
          });
        },
        deleteSavedFilter: (id) => {
          set((draft) => {
            const filter = draft.savedFilters.find((f) => f.id === id);
            if (!filter) {
              return;
            }
            if (
              draft.activeFilter &&
              filterKey(draft.activeFilter) === filterKey(filter.criteria)
            ) {
              draft.activeFilter = null;
              draft.zoomRestoreTime = null;
            }
            draft.savedFilters = draft.savedFilters.filter((f) => f.id !== id);
          });
        },
        setDashboardChartRange: (from, to) => {
          set((draft) => {
            const active = draft.activeFilter ?? emptyCriteria();
            if (!isZoomTime(active.time)) {
              draft.zoomRestoreTime = active.time;
            }
            active.time = { kind: 'range', from, to, source: 'zoom' };
            draft.activeFilter = active;
          });
        },
        clearDashboardChartRange: () => {
          const state = get();
          const active = state.activeFilter;
          if (!active || !isZoomTime(active.time)) {
            return;
          }
          const restored: FilterCriteria = { ...active, time: state.zoomRestoreTime };
          if (isEmptyCriteria(restored)) {
            set({ activeFilter: null, zoomRestoreTime: null });
            return;
          }
          set({ activeFilter: restored, zoomRestoreTime: null });
        },
        resetFilters: () => {
          set({
            savedFilters: createDefaultSavedFilters(),
            activeFilter: null,
            zoomRestoreTime: null,
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
        version: 4,
        migrate: (persistedState, fromVersion) =>
          migrateFilters(persistedState, fromVersion) as FiltersState,
        partialize: (state): PersistedFilters => ({
          savedFilters: state.savedFilters,
          activeFilter: state.activeFilter,
          zoomRestoreTime: state.zoomRestoreTime,
          loadChartGroupBy: state.loadChartGroupBy,
          volumeChartMetric: state.volumeChartMetric,
        }),
      },
    ),
  ),
);
