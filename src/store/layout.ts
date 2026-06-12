import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

interface LayoutState {
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  mobileMapActive: boolean;
  toggleMobileMap: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  immer(
    persist(
      (set) => ({
        onboardingComplete: false,
        completeOnboarding: () => set({ onboardingComplete: true }),
        demoMode: false,
        setDemoMode: (v) => set({ demoMode: v }),
        mobileMapActive: false,
        toggleMobileMap: () =>
          set((draft) => {
            draft.mobileMapActive = !draft.mobileMapActive;
          }),
      }),
      {
        name: 'store-layout',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 3,
        migrate: (persisted, version) => {
          const state = persisted as Record<string, unknown>;
          if (version < 2) {
            state.demoMode = false;
          }
          if (version < 3) {
            state.mobileMapActive = false;
          }
          return state as unknown as LayoutState;
        },
      },
    ),
  ),
);
