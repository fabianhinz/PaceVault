import { useEffect, useMemo, useState } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { computeMetrics } from '@pacevault/engine/metrics.ts';
import { computeRunningZones } from '@pacevault/engine/zones.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { generateWeeklyPlan } from '@/lib/prescription.ts';
import { getMondayOfWeek, buildPlanCacheKey } from '@/lib/weekKey.ts';
import { toDateString } from '@/lib/formatters.ts';
import type { RunningZone } from '@pacevault/engine/types.ts';
import type { WeeklyPlan } from '@/types/index.ts';

export const useCoachPlan = (): {
  plan: WeeklyPlan | null;
  zones: RunningZone[];
  hasThresholdPace: boolean;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const profile = useUserStore((s) => s.profile);
  const cachedPlan = useCoachPlanStore((s) => s.cachedPlan);
  const cacheKey = useCoachPlanStore((s) => s.cacheKey);

  const [today, setToday] = useState(() => toDateString(Date.now()));

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const id = setTimeout(() => setToday(toDateString(Date.now())), msUntilMidnight);
    return () => clearTimeout(id);
  }, [today]);

  const result = useMemo(() => {
    let thresholdPace: number | undefined = undefined;
    if (profile) thresholdPace = thresholdsAt(profile, Date.now()).thresholdPace;

    if (!thresholdPace) {
      return { plan: null, zones: [], hasThresholdPace: false, freshPlan: null, freshKey: null };
    }

    const weekOf = getMondayOfWeek(today);
    const currentKey = buildPlanCacheKey(weekOf, sessions.length, thresholdPace);

    if (cachedPlan && cacheKey === currentKey) {
      const zones = computeRunningZones(thresholdPace);
      return { plan: cachedPlan, zones, hasThresholdPace: true, freshPlan: null, freshKey: null };
    }

    const zones = computeRunningZones(thresholdPace);
    const history = computeMetrics(sessions);
    let current = undefined;
    if (history.length > 0) {
      current = history[history.length - 1];
    }
    const plan = generateWeeklyPlan(current, zones, today, history.length);

    return { plan, zones, hasThresholdPace: true, freshPlan: plan, freshKey: currentKey };
  }, [sessions, profile, today, cachedPlan, cacheKey]);

  useEffect(() => {
    if (result.freshPlan && result.freshKey) {
      useCoachPlanStore.getState().setPlan(result.freshPlan, result.freshKey);
    }
  }, [result.freshPlan, result.freshKey]);

  return { plan: result.plan, zones: result.zones, hasThresholdPace: result.hasThresholdPace };
};
