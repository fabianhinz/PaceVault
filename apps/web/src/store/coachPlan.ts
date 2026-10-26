import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WeeklyPlan } from '@/types.ts';
import { idbStorage } from '@/lib/db.ts';

interface CoachPlanState {
  cachedPlan: WeeklyPlan | null;
  cacheKey: string | null;
  setPlan: ({ plan, key }: { plan: WeeklyPlan; key: string }) => void;
  clearPlan: () => void;
}

export const INITIAL_COACH_PLAN_STORE_STATE: Pick<CoachPlanState, 'cachedPlan' | 'cacheKey'> = {
  cachedPlan: null,
  cacheKey: null,
};

export const useCoachPlanStore = create<CoachPlanState>()(
  immer(
    persist(
      (set) => ({
        ...INITIAL_COACH_PLAN_STORE_STATE,

        setPlan: ({ plan, key }) => set({ cachedPlan: plan, cacheKey: key }),

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
