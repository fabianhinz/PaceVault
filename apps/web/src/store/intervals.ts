import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/storage/db.ts';

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

export const INITIAL_INTERVALS_STORE_STATE: Pick<
  IntervalsState,
  'apiKey' | 'importedActivityIds' | 'keyInvalid' | 'backlogPending'
> = {
  apiKey: null,
  importedActivityIds: [],
  keyInvalid: false,
  backlogPending: false,
};

export const useIntervalsStore = create<IntervalsState>()(
  immer(
    persist(
      (set) => ({
        ...INITIAL_INTERVALS_STORE_STATE,

        connectIntervals: (apiKey) =>
          set((draft) => {
            draft.apiKey = apiKey;
            draft.keyInvalid = false;
          }),

        disconnectIntervals: () => set(INITIAL_INTERVALS_STORE_STATE),

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
