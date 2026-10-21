import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { computeMetrics } from '@pacevault/engine/metrics.ts';
import { getCoachingRecommendation } from '@/lib/coachingMessages.ts';
import type { DailyMetrics } from '@pacevault/engine/types.ts';
import type { CoachingRecommendation } from '@/types/index.ts';

export const useMetrics = (): {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
  coaching: CoachingRecommendation;
} => {
  const sessions = useSessionsStore((s) => s.sessions);

  return useMemo(() => {
    const history = computeMetrics(sessions);
    let current: DailyMetrics | undefined = undefined;
    if (history.length > 0) {
      current = history[history.length - 1];
    }
    const coaching = getCoachingRecommendation(current, history.length);
    return { history, current, coaching };
  }, [sessions]);
};
