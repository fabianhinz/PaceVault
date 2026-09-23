import {
  FULL_HISTORY_OLDEST,
  listIntervalsActivities,
  MAX_ACTIVITIES_PER_IMPORT,
  type IntervalsActivity,
} from '@/lib/intervals.ts';
import { intervalsSyncWindowOldest } from '@/lib/intervalsSyncWindow.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useIntervalsProgressStore } from './syncProgress.ts';
import { runIntervalsImport } from './runIntervalsImport.ts';

export interface IntervalsSyncSummary {
  available: number;
  pending: number;
  imported: number;
  duplicated: number;
}

const NOTHING: IntervalsSyncSummary = { available: 0, pending: 0, imported: 0, duplicated: 0 };

const byNewestFirst = (a: IntervalsActivity, b: IntervalsActivity): number => {
  return (b.start_date_local ?? '').localeCompare(a.start_date_local ?? '');
};

const resolveOldest = (full: boolean): string => {
  if (full || useIntervalsStore.getState().backlogPending) return FULL_HISTORY_OLDEST;
  return intervalsSyncWindowOldest(useSessionsStore.getState().sessions) ?? FULL_HISTORY_OLDEST;
};

export const runIntervalsSync = async (options?: {
  full?: boolean;
}): Promise<IntervalsSyncSummary> => {
  const apiKey = useIntervalsStore.getState().apiKey;
  const profile = useUserStore.getState().profile;
  if (apiKey === null || profile === null) return NOTHING;

  const oldest = resolveOldest(options?.full === true);
  const isFullListing = oldest === FULL_HISTORY_OLDEST;

  const listed = await listIntervalsActivities(apiKey, oldest);
  if (!listed.ok) {
    if (listed.code === 'unauthorized') useIntervalsStore.getState().markIntervalsKeyInvalid();
    throw new Error(listed.code);
  }

  const known = new Set(useIntervalsStore.getState().importedActivityIds);
  const backlog = listed.data.filter((a) => !known.has(a.id)).sort(byNewestFirst);
  const batch = backlog.slice(0, MAX_ACTIVITIES_PER_IMPORT);
  if (batch.length === 0) {
    if (isFullListing) useIntervalsStore.getState().setIntervalsBacklogPending(false);
    return { ...NOTHING, available: listed.data.length };
  }

  const foreground = useIntervalsProgressStore.getState().foreground;
  useIntervalsProgressStore.getState().startIntervalsSync(batch.length);

  try {
    const result = await runIntervalsImport(
      apiKey,
      profile,
      batch,
      (processed) => useIntervalsProgressStore.getState().setIntervalsSyncProcessed(processed),
      { markNew: !foreground },
    );

    useIntervalsStore.getState().recordIntervalsImported(result.importedActivityIds);
    if (result.fatal === 'unauthorized') useIntervalsStore.getState().markIntervalsKeyInvalid();

    const incomplete = backlog.length > batch.length || result.fatal !== undefined;
    if (incomplete) useIntervalsStore.getState().setIntervalsBacklogPending(true);
    else if (isFullListing) useIntervalsStore.getState().setIntervalsBacklogPending(false);

    return {
      available: listed.data.length,
      pending: batch.length,
      imported: result.imported,
      duplicated: result.duplicated,
    };
  } finally {
    useIntervalsProgressStore.getState().finishIntervalsSync();
  }
};
