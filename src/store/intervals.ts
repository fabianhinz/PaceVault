import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

interface IntervalsState {
  apiKey: string | null;
  athleteFirstName: string | null;
  importedActivityIds: string[];
  keyInvalid: boolean;
  connectIntervals: (apiKey: string, athleteFirstName: string | null) => void;
  disconnectIntervals: () => void;
  recordIntervalsImported: (importedIds: string[]) => void;
  markIntervalsKeyInvalid: () => void;
}

export const useIntervalsStore = create<IntervalsState>()(
  immer(
    persist(
      (set) => ({
        apiKey: null,
        athleteFirstName: null,
        importedActivityIds: [],
        keyInvalid: false,

        connectIntervals: (apiKey, athleteFirstName) =>
          set((draft) => {
            draft.apiKey = apiKey;
            draft.athleteFirstName = athleteFirstName;
            draft.keyInvalid = false;
          }),

        disconnectIntervals: () =>
          set({
            apiKey: null,
            athleteFirstName: null,
            importedActivityIds: [],
            keyInvalid: false,
          }),

        recordIntervalsImported: (importedIds) =>
          set((draft) => {
            const merged = new Set(draft.importedActivityIds);
            for (const id of importedIds) {
              merged.add(id);
            }
            draft.importedActivityIds = [...merged];
          }),

        markIntervalsKeyInvalid: () =>
          set((draft) => {
            draft.keyInvalid = true;
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
