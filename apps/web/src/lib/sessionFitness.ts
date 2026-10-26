import { localDayKey } from '@pacevault/engine/metrics.ts';
import type { DailyMetrics } from '@pacevault/engine/types.ts';

export const ctlOnDate = ({
  history,
  timestamp,
}: {
  history: DailyMetrics[];
  timestamp: number;
}): number => {
  const day = localDayKey(timestamp);
  const entry = history.find((metrics) => metrics.date === day);
  if (entry === undefined) return 0;
  return entry.ctl;
};
