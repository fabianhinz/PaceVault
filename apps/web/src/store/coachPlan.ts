import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WeeklyPlan } from '@/types/index.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

interface CoachPlanState {
  cachedPlan: WeeklyPlan | null;
  cacheKey: string | null;
  setPlan: (plan: WeeklyPlan, key: string) => void;
  clearPlan: () => void;
}

export const useCoachPlanStore = create<CoachPlanState>()(
  immer(
    persist(
      (set) => ({
        cachedPlan: null,
        cacheKey: null,

        setPlan: (plan, key) => set({ cachedPlan: plan, cacheKey: key }),

        clearPlan: () => set({ cachedPlan: null, cacheKey: null }),
      }),
      {
        name: 'store-coach-plan',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
