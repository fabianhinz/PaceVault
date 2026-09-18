import { useQuery } from '@tanstack/react-query';
import { useIntervalsStore } from '@/store/intervals.ts';
import { listIntervalsActivities } from '@/lib/intervals/activities.ts';
import { buildRangeWindow, type ImportRange } from '@/lib/intervals/intervalsDates.ts';
import { buildSyncPlan, countSkipReasons } from '@/lib/intervals/syncPlan.ts';
import type { IntervalsErrorCode } from '@/lib/intervals/client.ts';
import { intervalsKeys } from '../intervalsKeys.ts';

const PREVIEW_STALE_MS = 5 * 60 * 1000;

interface IntervalsPreview {
  totalListed: number;
  importable: number;
  unsupported: number;
  unavailable: number;
  alreadyImported: number;
  error?: IntervalsErrorCode;
}

const loadPreview = async (
  apiKey: string,
  range: ImportRange,
  knownActivityIds: string[],
): Promise<IntervalsPreview> => {
  const window = buildRangeWindow(range, Date.now());
  const listing = await listIntervalsActivities(apiKey, window);

  if (!listing.ok) {
    return {
      totalListed: 0,
      importable: 0,
      unsupported: 0,
      unavailable: 0,
      alreadyImported: 0,
      error: listing.code,
    };
  }

  const plan = buildSyncPlan({ listing: listing.data.activities, knownActivityIds });
  const counts = countSkipReasons(plan);

  return {
    totalListed: plan.totalListed,
    importable: plan.toImport.length,
    unsupported: counts['unsupported-type'],
    unavailable: counts['stub-source'] + counts['no-file'],
    alreadyImported: counts['already-imported'],
  };
};

export const useIntervalsPreview = (range: ImportRange) => {
  const apiKey = useIntervalsStore((s) => s.apiKey);
  const knownActivityIds = useIntervalsStore((s) => s.importedActivityIds);

  return useQuery({
    queryKey: intervalsKeys.preview(range),
    queryFn: () => loadPreview(apiKey ?? '', range, knownActivityIds),
    enabled: apiKey !== null,
    staleTime: PREVIEW_STALE_MS,
    retry: false,
  });
};
