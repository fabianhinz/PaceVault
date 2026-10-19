import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

interface IntervalsState {
  apiKey: string | null;
  importedActivityIds: string[];
  keyInvalid: boolean;
  backlogPending: boolean;
  connectIntervals: (apiKey: string) => void;
  disconnectIntervals: () => void;
  recordIntervalsImported: (importedIds: string[]) => void;
  markIntervalsKeyInvalid: () => void;
  setIntervalsBacklogPending: (pending: boolean) => void;
}

export const useIntervalsStore = create<IntervalsState>()(
  immer(
    persist(
      (set) => ({
        apiKey: null,
        importedActivityIds: [],
        keyInvalid: false,
        backlogPending: false,

        connectIntervals: (apiKey) =>
          set((draft) => {
            draft.apiKey = apiKey;
            draft.keyInvalid = false;
          }),

        disconnectIntervals: () =>
          set({
            apiKey: null,
            importedActivityIds: [],
            keyInvalid: false,
            backlogPending: false,
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

        setIntervalsBacklogPending: (pending) =>
          set((draft) => {
            draft.backlogPending = pending;
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
