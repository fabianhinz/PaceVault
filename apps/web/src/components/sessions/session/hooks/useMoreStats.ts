import { useMemo } from 'react';
import { buildMoreStats, type MoreStats } from '@/lib/analysis/moreStats.ts';
import { useThresholdsAt } from '@/components/settings/hooks/useThresholdsAt.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';

export const useMoreStats = ({
  session,
  records,
}: {
  session: TrainingSession;
  records: SessionRecord[];
}): MoreStats => {
  const thresholds = useThresholdsAt(session.date);
  return useMemo(
    () => buildMoreStats({ session, records, thresholds }),
    [session, records, thresholds],
  );
};
