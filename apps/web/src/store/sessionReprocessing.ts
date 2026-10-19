import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type SessionReprocessingPhase = 'pending' | 'waiting' | 'running' | 'done';

interface SessionReprocessingState {
  phase: SessionReprocessingPhase;
  newerVersionInOtherTab: boolean;
  setSessionReprocessingPhase: (phase: SessionReprocessingPhase) => void;
  markNewerVersionInOtherTab: () => void;
}

export const useSessionReprocessingStore = create<SessionReprocessingState>()(
  immer((set) => ({
    phase: 'pending',
    newerVersionInOtherTab: false,

    setSessionReprocessingPhase: (phase) =>
      set((draft) => {
        draft.phase = phase;
      }),

    markNewerVersionInOtherTab: () =>
      set((draft) => {
        draft.newerVersionInOtherTab = true;
      }),
  })),
);
