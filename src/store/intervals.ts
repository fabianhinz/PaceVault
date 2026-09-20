import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

const MAX_TRACKED_ACTIVITY_IDS = 20000;

interface IntervalsState {
  apiKey: string | null;
  athleteFirstName: string | null;
  lastSyncedAt: number | null;
  importedActivityIds: string[];
  connectIntervals: (apiKey: string, athleteFirstName: string | null) => void;
  disconnectIntervals: () => void;
  recordIntervalsImported: (importedIds: string[]) => void;
  markIntervalsSynced: (syncedAt: number) => void;
}

export const useIntervalsStore = create<IntervalsState>()(
  immer(
    persist(
      (set) => ({
        apiKey: null,
        athleteFirstName: null,
        lastSyncedAt: null,
        importedActivityIds: [],

        connectIntervals: (apiKey, athleteFirstName) =>
          set((draft) => {
            draft.apiKey = apiKey;
            draft.athleteFirstName = athleteFirstName;
          }),

        disconnectIntervals: () =>
          set({
            apiKey: null,
            athleteFirstName: null,
            lastSyncedAt: null,
            importedActivityIds: [],
          }),

        recordIntervalsImported: (importedIds) =>
          set((draft) => {
            const merged = new Set(draft.importedActivityIds);
            for (const id of importedIds) {
              merged.add(id);
            }

            const all = [...merged];
            if (all.length > MAX_TRACKED_ACTIVITY_IDS) {
              draft.importedActivityIds = all.slice(all.length - MAX_TRACKED_ACTIVITY_IDS);
            } else {
              draft.importedActivityIds = all;
            }
          }),

        markIntervalsSynced: (syncedAt) =>
          set((draft) => {
            draft.lastSyncedAt = syncedAt;
          }),
      }),
      {
        name: 'store-intervals',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
