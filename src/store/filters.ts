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
import { VOLUME_METRICS, type VolumeMetric } from '@/lib/dashboardVolume.ts';
import type { FilterTime } from '@/lib/timeRange.ts';
import { SPORTS } from '@/packages/engine/types.ts';

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

const v3TimeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('relative'),
    amount: z.number().int().positive(),
    unit: z.enum(['day', 'week', 'month']),
  }),
  z.object({ kind: z.literal('calendarYear'), yearsAgo: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('range'),
    from: z.string(),
    to: z.string(),
    source: z.enum(['year', 'month', 'months', 'zoom']),
  }),
]);

const v3CriteriaSchema = z.object({
  sport: z.enum(SPORTS).nullable(),
  time: v3TimeSchema.nullable(),
  distance: z.number().nullable(),
  duration: z.number().nullable(),
  elevationGain: z.number().nullable(),
});

const v3SavedFilterSchema = z.object({ id: z.string(), criteria: v3CriteriaSchema });

const v3StateSchema = z.object({
  savedFilters: z.array(z.unknown()),
  activeFilter: z.unknown(),
  volumeChartMetric: z.unknown(),
});

const volumeMetricSchema = z.enum(VOLUME_METRICS);

/** v4 reads "last year" as the rolling 365 days, so the old calendar "last year" moves with it. */
const toV4Time = (time: FilterTime | null): FilterTime | null => {
  if (time !== null && time.kind === 'calendarYear' && time.yearsAgo === 1) {
    return { kind: 'relative', amount: 365, unit: 'day' };
  }
  return time;
};

const toV4Criteria = (criteria: z.infer<typeof v3CriteriaSchema>): FilterCriteria => ({
  sport: criteria.sport,
  time: toV4Time(criteria.time),
  distance: criteria.distance,
  duration: criteria.duration,
  elevationGain: criteria.elevationGain,
  name: null,
});

const migrateV3 = (persistedState: unknown, migrated: PersistedFilters) => {
  const state = v3StateSchema.safeParse(persistedState);
  if (!state.success) {
    return;
  }
  const saved: SavedFilter[] = [];
  const keys = new Set<string>();
  for (const entry of state.data.savedFilters) {
    const filter = v3SavedFilterSchema.safeParse(entry);
    if (!filter.success) {
      continue;
    }
    const criteria = toV4Criteria(filter.data.criteria);
    const key = filterKey(criteria);
    if (keys.has(key)) {
      continue;
    }
    keys.add(key);
    saved.push({ id: filter.data.id, criteria });
  }
  if (saved.length > 0) {
    migrated.savedFilters = saved;
  }
  const active = v3CriteriaSchema.safeParse(state.data.activeFilter);
  if (active.success) {
    migrated.activeFilter = toV4Criteria(active.data);
  }
  const metric = volumeMetricSchema.safeParse(state.data.volumeChartMetric);
  if (metric.success) {
    migrated.volumeChartMetric = metric.data;
  }
};

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
  if (fromVersion === 3) {
    migrateV3(persistedState, migrated);
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
        version: 4,
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
