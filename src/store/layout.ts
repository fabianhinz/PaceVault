import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import { idbStorage } from '@/lib/idbStorage.ts';

const mobileSheetPositionSchema = z.number().min(0).max(1);

const legacySnapPositions: Record<string, number> = { peek: 0, half: 0.5, full: 1 };

interface LayoutState {
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  mobileSheetPosition: number;
  setMobileSheetPosition: (position: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  immer(
    persist(
      (set) => ({
        onboardingComplete: false,
        completeOnboarding: () => set({ onboardingComplete: true }),
        demoMode: false,
        setDemoMode: (v) => set({ demoMode: v }),
        mobileSheetPosition: 0.5,
        setMobileSheetPosition: (position) => set({ mobileSheetPosition: position }),
      }),
      {
        name: 'store-layout',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 5,
        migrate: (persisted, version) => {
          const state = persisted as Record<string, unknown>;
          if (version < 2) {
            state.demoMode = false;
          }
          if (version < 4) {
            if (state.mobileMapActive === true) {
              state.mobileSheetSnap = 'peek';
            } else {
              state.mobileSheetSnap = 'half';
            }
            delete state.mobileMapActive;
          }
          if (version < 5) {
            state.mobileSheetPosition = legacySnapPositions[String(state.mobileSheetSnap)];
            delete state.mobileSheetSnap;
          }
          const position = mobileSheetPositionSchema.safeParse(state.mobileSheetPosition);
          if (position.success) {
            state.mobileSheetPosition = position.data;
          } else {
            state.mobileSheetPosition = 0.5;
          }
          return state as unknown as LayoutState;
        },
      },
    ),
  ),
);
