import { useEffect, useMemo, useState } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { runningZonesFromThresholdPace } from '@pacevault/engine/zones.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { generateFreshPlan } from '@/lib/prescription.ts';
import { getMondayOfWeek, buildPlanCacheKey } from '@/lib/weekKey.ts';
import { toDateString } from '@/lib/formatters.ts';
import type { RunningZone } from '@pacevault/engine/types.ts';
import type { WeeklyPlan } from '@/types.ts';

interface CoachPlan {
  plan: WeeklyPlan | null;
  zones: RunningZone[];
  thresholdPaceSet: boolean;
}

export const useCoachPlan = (): CoachPlan => {
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

  const resolvedPlan = useMemo(() => {
    let thresholdPace: number | undefined = undefined;
    if (profile) thresholdPace = thresholdsAt({ profile, date: Date.now() }).thresholdPace;

    if (!thresholdPace) {
      return { plan: null, zones: [], thresholdPaceSet: false, freshPlan: null, freshKey: null };
    }

    const weekOf = getMondayOfWeek(today);
    const loads = sessions.map((session) => session.tss);
    const currentKey = buildPlanCacheKey({ weekOf, loads, thresholdPace });

    if (cachedPlan && cacheKey === currentKey) {
      const zones = runningZonesFromThresholdPace(thresholdPace);
      return { plan: cachedPlan, zones, thresholdPaceSet: true, freshPlan: null, freshKey: null };
    }

    const zones = runningZonesFromThresholdPace(thresholdPace);
    const plan = generateFreshPlan({ sessions, zones, today });

    return { plan, zones, thresholdPaceSet: true, freshPlan: plan, freshKey: currentKey };
  }, [sessions, profile, today, cachedPlan, cacheKey]);

  useEffect(() => {
    if (resolvedPlan.freshPlan && resolvedPlan.freshKey) {
      useCoachPlanStore
        .getState()
        .setPlan({ plan: resolvedPlan.freshPlan, key: resolvedPlan.freshKey });
    }
  }, [resolvedPlan.freshPlan, resolvedPlan.freshKey]);

  return {
    plan: resolvedPlan.plan,
    zones: resolvedPlan.zones,
    thresholdPaceSet: resolvedPlan.thresholdPaceSet,
  };
};
