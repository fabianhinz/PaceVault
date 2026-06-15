import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import { rangeToCutoff, customRangeToCutoffs, type TimeRange } from '@/lib/timeRange.ts';
import {
  type AttributeFilters,
  createEmptyAttributeFilters,
  matchesAttributeFilters,
  sanitizeAttributeFilters,
} from '@/lib/attributeFilters.ts';
import { getRecordsForSessions } from '@/lib/indexeddb.ts';
import { computePBsForSessions, groupPBsBySport } from '@/lib/records.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { PersonalBest, Sport } from '@/packages/engine/types.ts';

type LoadChartGroupBy = 'day' | 'week' | 'month';

interface FiltersState {
  timeRange: TimeRange;
  customRange: { from: string; to: string } | null;
  prevDashboardRange: Exclude<TimeRange, 'custom'> | null;
  sportFilter: Sport | 'all';
  attributeFilters: AttributeFilters;
  loadChartShowSportColors: boolean;
  loadChartGroupBy: LoadChartGroupBy;
  groupedPBs: { data: Partial<Record<Sport, PersonalBest[]>>; loading: boolean };
  setTimeRange: (r: TimeRange) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearDashboardChartRange: () => void;
  setSportFilter: (s: Sport | 'all') => void;
  setAttributeFilters: (f: AttributeFilters) => void;
  clearAttributeFilters: () => void;
  setLoadChartShowSportColors: (show: boolean) => void;
  setLoadChartGroupBy: (groupBy: LoadChartGroupBy) => void;
  recomputePBs: () => Promise<void>;
}

export const useFiltersStore = create<FiltersState>()(
  immer(
    persist(
      (set, get) => ({
        timeRange: 'all',
        customRange: null,
        prevDashboardRange: null,
        sportFilter: 'all',
        attributeFilters: createEmptyAttributeFilters(),
        loadChartShowSportColors: false,
        loadChartGroupBy: 'week',
        groupedPBs: { data: {}, loading: false },
        setTimeRange: (r) => {
          set({ timeRange: r, customRange: null, prevDashboardRange: null });
          get().recomputePBs();
        },
        setDashboardChartRange: (from, to) => {
          set((draft) => {
            if (draft.timeRange !== 'custom') {
              draft.prevDashboardRange = draft.timeRange as Exclude<TimeRange, 'custom'>;
            }
            draft.timeRange = 'custom';
            draft.customRange = { from, to };
          });
          get().recomputePBs();
        },
        clearDashboardChartRange: () => {
          set((draft) => {
            draft.timeRange = draft.prevDashboardRange ?? '90d';
            draft.customRange = null;
            draft.prevDashboardRange = null;
          });
          get().recomputePBs();
        },
        setSportFilter: (sportFilter) => {
          set({ sportFilter });
          get().recomputePBs();
        },
        setAttributeFilters: (f) => {
          set({ attributeFilters: sanitizeAttributeFilters(f) });
          get().recomputePBs();
        },
        clearAttributeFilters: () => {
          set({ attributeFilters: createEmptyAttributeFilters() });
          get().recomputePBs();
        },
        setLoadChartShowSportColors: (loadChartShowSportColors) => {
          set({ loadChartShowSportColors });
        },
        setLoadChartGroupBy: (loadChartGroupBy) => {
          set({ loadChartGroupBy });
        },
        recomputePBs: async () => {
          const { groupedPBs, timeRange, customRange, sportFilter, attributeFilters } = get();
          if (groupedPBs.loading) {
            return;
          }

          set((draft) => {
            draft.groupedPBs.loading = true;
          });

          let dateCutoff = 0;
          let dateUpperBound = Infinity;
          if (timeRange === 'custom' && customRange) {
            const bounds = customRangeToCutoffs(customRange);
            dateCutoff = bounds.from;
            dateUpperBound = bounds.to;
          } else {
            dateCutoff = rangeToCutoff(timeRange as Exclude<TimeRange, 'custom'>);
          }

          const filteredSessions = useSessionsStore
            .getState()
            .sessions.filter(
              (s) =>
                !s.isPlanned &&
                s.date >= dateCutoff &&
                s.date <= dateUpperBound &&
                s.hasDetailedRecords &&
                (sportFilter === 'all' || s.sport === sportFilter) &&
                matchesAttributeFilters(s, attributeFilters),
            );

          if (filteredSessions.length === 0) {
            set({ groupedPBs: { data: {}, loading: false } });
            return;
          }

          try {
            const recordsMap = await getRecordsForSessions(filteredSessions.map((s) => s.id));
            set({
              groupedPBs: {
                data: groupPBsBySport(
                  computePBsForSessions(
                    filteredSessions.map((s) => ({
                      sessionId: s.id,
                      date: s.date,
                      sport: s.sport,
                      records: recordsMap.get(s.id) ?? [],
                      distance: s.distance,
                      elevationGain: s.elevationGain,
                    })),
                  ),
                ),
                loading: false,
              },
            });
          } catch {
            set({ groupedPBs: { data: {}, loading: false } });
          }
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
            state.loadChartShowSportColors = false;
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
