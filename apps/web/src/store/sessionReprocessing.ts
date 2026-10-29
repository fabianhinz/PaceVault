import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type SessionReprocessingPhase = 'pending' | 'waiting' | 'running' | 'done';

interface SessionReprocessingState {
  phase: SessionReprocessingPhase;
  newerVersionInOtherTab: boolean;
  setSessionReprocessingPhase: (phase: SessionReprocessingPhase) => void;
  markNewerVersionInOtherTab: () => void;
}

export const INITIAL_SESSION_REPROCESSING_STORE_STATE: Pick<
  SessionReprocessingState,
  'phase' | 'newerVersionInOtherTab'
> = {
  phase: 'pending',
  newerVersionInOtherTab: false,
};

export const useSessionReprocessingStore = create<SessionReprocessingState>()(
  immer((set) => ({
    ...INITIAL_SESSION_REPROCESSING_STORE_STATE,

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
