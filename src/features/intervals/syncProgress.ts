import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface IntervalsProgressState {
  processed: number;
  total: number;
  foreground: boolean;
  setIntervalsSyncForeground: (foreground: boolean) => void;
  startIntervalsSync: (total: number) => void;
  setIntervalsSyncProcessed: (processed: number) => void;
  finishIntervalsSync: () => void;
}

export const useIntervalsProgressStore = create<IntervalsProgressState>()(
  immer((set) => ({
    processed: 0,
    total: 0,
    foreground: false,

    setIntervalsSyncForeground: (foreground) =>
      set((draft) => {
        draft.foreground = foreground;
      }),

    startIntervalsSync: (total) =>
      set((draft) => {
        draft.processed = 0;
        draft.total = total;
      }),

    setIntervalsSyncProcessed: (processed) =>
      set((draft) => {
        draft.processed = processed;
      }),

    finishIntervalsSync: () =>
      set((draft) => {
        draft.processed = 0;
        draft.total = 0;
      }),
  })),
);
