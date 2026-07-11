import { useSyncExternalStore } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useStudioStore } from '@/store/studio.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFiltersStore } from '@/store/filters.ts';

const subscribe = (cb: () => void): (() => void) => {
  const unsubs = [
    useUserStore.persist.onFinishHydration(cb),
    useSessionsStore.persist.onFinishHydration(cb),
    useTripsStore.persist.onFinishHydration(cb),
    useStudioStore.persist.onFinishHydration(cb),
    useCoachPlanStore.persist.onFinishHydration(cb),
    useLayoutStore.persist.onFinishHydration(cb),
    useFiltersStore.persist.onFinishHydration(cb),
  ];
  return () => unsubs.forEach((u) => u());
};

const getSnapshot = (): boolean => {
  return (
    useUserStore.persist.hasHydrated() &&
    useSessionsStore.persist.hasHydrated() &&
    useTripsStore.persist.hasHydrated() &&
    useStudioStore.persist.hasHydrated() &&
    useCoachPlanStore.persist.hasHydrated() &&
    useLayoutStore.persist.hasHydrated() &&
    useFiltersStore.persist.hasHydrated()
  );
};

export const useStoresHydrated = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
