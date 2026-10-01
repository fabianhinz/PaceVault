import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import {
  type AttributeFilters,
  createEmptyAttributeFilters,
  sanitizeAttributeFilters,
} from '@/lib/attributeFilters.ts';
import type { Sport } from '@/packages/engine/types.ts';

type LoadChartGroupBy = 'day' | 'week' | 'month';

interface FiltersState {
  timeRange: TimeRange;
  customRange: { from: string; to: string } | null;
  prevDashboardRange: Exclude<TimeRange, 'custom'> | null;
  sportFilter: Sport | 'all';
  attributeFilters: AttributeFilters;
  loadChartShowSportColors: boolean;
  loadChartGroupBy: LoadChartGroupBy;
  setTimeRange: (r: TimeRange) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearDashboardChartRange: () => void;
  setSportFilter: (s: Sport | 'all') => void;
  setAttributeFilters: (f: AttributeFilters) => void;
  clearAttributeFilters: () => void;
  setLoadChartShowSportColors: (show: boolean) => void;
  setLoadChartGroupBy: (groupBy: LoadChartGroupBy) => void;
}

export const useFiltersStore = create<FiltersState>()(
  immer(
    persist(
      (set) => ({
        timeRange: 'all',
        customRange: null,
        prevDashboardRange: null,
        sportFilter: 'all',
        attributeFilters: createEmptyAttributeFilters(),
        loadChartShowSportColors: true,
        loadChartGroupBy: 'week',
        setTimeRange: (r) => {
          set({ timeRange: r, customRange: null, prevDashboardRange: null });
        },
        setDashboardChartRange: (from, to) => {
          set((draft) => {
            if (draft.timeRange !== 'custom') {
              draft.prevDashboardRange = draft.timeRange as Exclude<TimeRange, 'custom'>;
            }
            draft.timeRange = 'custom';
            draft.customRange = { from, to };
          });
        },
        clearDashboardChartRange: () => {
          set((draft) => {
            draft.timeRange = draft.prevDashboardRange ?? '90d';
            draft.customRange = null;
            draft.prevDashboardRange = null;
          });
        },
        setSportFilter: (sportFilter) => {
          set({ sportFilter });
        },
        setAttributeFilters: (f) => {
          set({ attributeFilters: sanitizeAttributeFilters(f) });
        },
        clearAttributeFilters: () => {
          set({ attributeFilters: createEmptyAttributeFilters() });
        },
        setLoadChartShowSportColors: (loadChartShowSportColors) => {
          set({ loadChartShowSportColors });
        },
        setLoadChartGroupBy: (loadChartGroupBy) => {
          set({ loadChartGroupBy });
        },
      }),
      {
        name: 'store-filters',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 2,
        migrate: (persistedState, fromVersion) => {
          const state = persistedState as Partial<FiltersState>;
          if (fromVersion < 2) {
            state.loadChartShowSportColors = true;
            state.loadChartGroupBy = 'week';
          }
          return state as FiltersState;
        },
        partialize: (state) => ({
          timeRange: state.timeRange,
          customRange: state.customRange,
          prevDashboardRange: state.prevDashboardRange,
          sportFilter: state.sportFilter,
          attributeFilters: state.attributeFilters,
          loadChartShowSportColors: state.loadChartShowSportColors,
          loadChartGroupBy: state.loadChartGroupBy,
        }),
      },
    ),
  ),
);
