import { describe, it, expect } from 'vite-plus/test';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { createMockWeeklyPlan } from '@tests/factories/coaching.ts';

describe('useCoachPlanStore', () => {
  it('has null initial state', () => {
    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toBeNull();
    expect(state.cacheKey).toBeNull();
  });

  it('stores plan and key via setPlan', () => {
    const plan = createMockWeeklyPlan({ weekOf: '2026-02-09' });
    useCoachPlanStore.getState().setPlan({ plan, key: '2026-02-09:3:300' });

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toEqual(plan);
    expect(state.cacheKey).toBe('2026-02-09:3:300');
  });

  it('resets both to null via clearPlan', () => {
    const plan = createMockWeeklyPlan({ weekOf: '2026-02-09' });
    useCoachPlanStore.getState().setPlan({ plan, key: '2026-02-09:3:300' });
    useCoachPlanStore.getState().clearPlan();

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toBeNull();
    expect(state.cacheKey).toBeNull();
  });

  it('overwrites previous values on subsequent setPlan', () => {
    const plan1 = createMockWeeklyPlan({ weekOf: '2026-02-09' });
    const plan2 = createMockWeeklyPlan({ weekOf: '2026-02-16' });

    useCoachPlanStore.getState().setPlan({ plan: plan1, key: '2026-02-09:3:300' });
    useCoachPlanStore.getState().setPlan({ plan: plan2, key: '2026-02-16:4:310' });

    const state = useCoachPlanStore.getState();
    expect(state.cachedPlan).toEqual(plan2);
    expect(state.cacheKey).toBe('2026-02-16:4:310');
  });
});
