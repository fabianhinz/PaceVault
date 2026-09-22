import { listIntervalsActivities, MAX_ACTIVITIES_PER_IMPORT } from '@/lib/intervals.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
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

export const runIntervalsSync = async (): Promise<IntervalsSyncSummary> => {
  const apiKey = useIntervalsStore.getState().apiKey;
  const profile = useUserStore.getState().profile;
  if (apiKey === null || profile === null) return NOTHING;

  const listed = await listIntervalsActivities(apiKey);
  if (!listed.ok) {
    if (listed.code === 'unauthorized') useIntervalsStore.getState().markIntervalsKeyInvalid();
    throw new Error(listed.code);
  }

  const known = new Set(useIntervalsStore.getState().importedActivityIds);
  const batch = listed.data.filter((a) => !known.has(a.id)).slice(0, MAX_ACTIVITIES_PER_IMPORT);
  if (batch.length === 0) return { ...NOTHING, available: listed.data.length };

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
