import type { QueryClient } from '@tanstack/react-query';
import {
  FULL_HISTORY_OLDEST,
  intervalsErrorCode,
  intervalsSyncWindowOldest,
  intervalsSyncWindowStart,
  listIntervalsActivities,
  MAX_ACTIVITIES_PER_IMPORT,
  type IntervalsActivity,
} from '@/lib/api/intervals.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { runIntervalsImport } from './intervalsImport.ts';
import type { IntervalsSyncSummary, UserProfile } from '@/types.ts';

const NOTHING: IntervalsSyncSummary = {
  available: 0,
  pending: 0,
  imported: 0,
  duplicated: 0,
  failed: 0,
};

const byNewestFirst = (a: IntervalsActivity, b: IntervalsActivity): number => {
  return (b.start_date_local ?? '').localeCompare(a.start_date_local ?? '');
};

const requestedByImport = (): boolean => {
  const foreground = useImportProgressStore.getState().foreground;
  return foreground?.source === 'intervals-import' && foreground.summary === null;
};

const resolveOldest = (foreground: boolean): string => {
  if (foreground || useIntervalsStore.getState().backlogPending) return FULL_HISTORY_OLDEST;
  return intervalsSyncWindowOldest(useSessionsStore.getState().sessions) ?? FULL_HISTORY_OLDEST;
};

const selectImportBatch = ({
  listing,
  importedIds,
}: {
  listing: IntervalsActivity[];
  importedIds: string[];
}): { backlog: IntervalsActivity[]; batch: IntervalsActivity[] } => {
  const known = new Set(importedIds);
  const backlog = listing.filter((a) => !known.has(a.id)).sort(byNewestFirst);
  const batch = backlog.slice(0, MAX_ACTIVITIES_PER_IMPORT);
  return { backlog, batch };
};

const importBatch = async ({
  batch,
  backlogLength,
  listingLength,
  fullListing,
  foreground,
  markNewSince,
  apiKey,
  profile,
  queryClient,
  signal,
}: {
  batch: IntervalsActivity[];
  backlogLength: number;
  listingLength: number;
  fullListing: boolean;
  foreground: boolean;
  markNewSince: number | undefined;
  apiKey: string;
  profile: UserProfile;
  queryClient: QueryClient;
  signal: AbortSignal | undefined;
}): Promise<IntervalsSyncSummary> => {
  try {
    const result = await runIntervalsImport({
      apiKey,
      profile,
      activities: batch,
      onProgress: () => {
        if (foreground) useImportProgressStore.getState().advanceImport();
      },
      queryClient,
      markNewSince,
      onSaving: () => {
        if (foreground) useImportProgressStore.getState().markImportSaving();
      },
      onChunkIngested: (ids) => useIntervalsStore.getState().recordIntervalsImported(ids),
      signal,
    });

    if (result.fatal === 'unauthorized') useIntervalsStore.getState().markIntervalsKeyInvalid();

    const incomplete = backlogLength > batch.length || result.fatal !== undefined;
    if (incomplete) useIntervalsStore.getState().setIntervalsBacklogPending(true);
    else if (fullListing) useIntervalsStore.getState().setIntervalsBacklogPending(false);

    return {
      available: listingLength,
      pending: batch.length,
      imported: result.imported,
      duplicated: result.duplicated,
      failed: result.failed,
    };
  } finally {
    if (!foreground) useImportProgressStore.getState().finishImport(null);
  }
};

export const runIntervalsSync = async (options: {
  queryClient: QueryClient;
  apiKey: string | null;
  signal?: AbortSignal;
}): Promise<IntervalsSyncSummary> => {
  const profile = useUserStore.getState().profile;
  if (options.apiKey === null || profile === null) return NOTHING;

  const foreground = requestedByImport();
  const markNewSince = intervalsSyncWindowStart(useSessionsStore.getState().sessions);
  const oldest = resolveOldest(foreground);
  const fullListing = oldest === FULL_HISTORY_OLDEST;

  let listing: IntervalsActivity[];
  try {
    listing = await listIntervalsActivities({
      apiKey: options.apiKey,
      oldest,
      signal: options.signal,
    });
  } catch (error) {
    if (intervalsErrorCode(error) === 'unauthorized') {
      useIntervalsStore.getState().markIntervalsKeyInvalid();
    }
    throw error;
  }

  const selection = selectImportBatch({
    listing,
    importedIds: useIntervalsStore.getState().importedActivityIds,
  });
  if (selection.batch.length === 0) {
    if (fullListing) useIntervalsStore.getState().setIntervalsBacklogPending(false);
    return { ...NOTHING, available: listing.length };
  }

  if (foreground) useImportProgressStore.getState().setImportTotal(selection.batch.length);
  else useImportProgressStore.getState().beginImport('intervals-sync');

  return await importBatch({
    batch: selection.batch,
    backlogLength: selection.backlog.length,
    listingLength: listing.length,
    fullListing,
    foreground,
    markNewSince,
    apiKey: options.apiKey,
    profile,
    queryClient: options.queryClient,
    signal: options.signal,
  });
};
