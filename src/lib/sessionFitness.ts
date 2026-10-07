import { defaultFormatter } from '@/packages/engine/formatter.ts';
import type { DailyMetrics } from '@/packages/engine/types.ts';

export const ctlOnDate = (history: DailyMetrics[], timestamp: number): number => {
  const day = defaultFormatter.date(timestamp);
  const entry = history.find((metrics) => metrics.date === day);
  if (entry === undefined) return 0;
  return entry.ctl;
};
