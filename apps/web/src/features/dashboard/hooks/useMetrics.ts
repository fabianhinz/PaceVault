import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';
import { getCoachingRecommendation } from '@/lib/coachingMessages.ts';
import type { DailyMetrics } from '@pacevault/engine/types.ts';
import type { CoachingRecommendation } from '@/types.ts';

interface TrainingMetrics {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
  coaching: CoachingRecommendation;
}

export const useMetrics = (): TrainingMetrics => {
  const sessions = useSessionsStore((s) => s.sessions);

  return useMemo(() => {
    const history = dailyMetricsFromSessions({ sessions });
    let current: DailyMetrics | undefined = undefined;
    if (history.length > 0) {
      current = history[history.length - 1];
    }
    const coaching = getCoachingRecommendation({ metrics: current, historyDays: history.length });
    return { history, current, coaching };
  }, [sessions]);
};
