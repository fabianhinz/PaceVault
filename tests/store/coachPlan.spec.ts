import { describe, it, expect } from 'vite-plus/test';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import type { WeeklyPlan } from '@/types/index.ts';

const makePlan = (weekOf: string): WeeklyPlan => ({
  weekOf,
  workouts: [],
  totalEstimatedTss: 0,
  context: { mode: 'no-data' },
});

describe('useCoachPlanStore', () => {
  it('has null initial state', () => {
    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toBeNull();
    expect(state.cacheKey).toBeNull();
  });

  it('stores plan and key via setPlan', () => {
    const plan = makePlan('2026-02-09');
    useCoachPlanStore.getState().setPlan(plan, '2026-02-09:3:300');

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toEqual(plan);
    expect(state.cacheKey).toBe('2026-02-09:3:300');
  });

  it('resets both to null via clearPlan', () => {
    const plan = makePlan('2026-02-09');
    useCoachPlanStore.getState().setPlan(plan, '2026-02-09:3:300');
    useCoachPlanStore.getState().clearPlan();

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toBeNull();
    expect(state.cacheKey).toBeNull();
  });

  it('overwrites previous values on subsequent setPlan', () => {
    const plan1 = makePlan('2026-02-09');
    const plan2 = makePlan('2026-02-16');

    useCoachPlanStore.getState().setPlan(plan1, '2026-02-09:3:300');
    useCoachPlanStore.getState().setPlan(plan2, '2026-02-16:4:310');

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toEqual(plan2);
    expect(state.cacheKey).toBe('2026-02-16:4:310');
  });
});
