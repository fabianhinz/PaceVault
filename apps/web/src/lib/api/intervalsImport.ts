import type { QueryClient } from '@tanstack/react-query';
import {
  downloadActivityFit,
  intervalsErrorCode,
  type IntervalsActivity,
  type IntervalsErrorCode,
} from '@/lib/api/intervals.ts';
import { FailedResponseError } from '@/lib/api/fetchResponse.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { createIngestBatcher } from '@/lib/storage/createIngestBatcher.ts';
import { toFitParseProfile } from '@/parsers/fitParseProfile.ts';
import type { UserProfile } from '@/types.ts';

interface IntervalsImportResult {
  imported: number;
  duplicated: number;
  failed: number;
  fatal?: IntervalsErrorCode;
}

export const DOWNLOAD_CONCURRENCY = 5;

type DownloadResult =
  | { kind: 'data'; data: ArrayBuffer }
  | { kind: 'request-failed'; code: IntervalsErrorCode }
  | { kind: 'unexpected'; error: unknown };

const isRequestFailure = (error: unknown): boolean =>
  error instanceof FailedResponseError ||
  error instanceof TypeError ||
  error instanceof DOMException;

// Never rejects, so a download left in flight after a fatal stop cannot surface as an unhandled
// rejection; an unexpected error is rethrown when its result is consumed.
const downloadResult = async ({
  apiKey,
  activity,
  signal,
}: {
  apiKey: string;
  activity: IntervalsActivity;
  signal: AbortSignal | undefined;
}): Promise<DownloadResult> => {
  try {
    return { kind: 'data', data: await downloadActivityFit({ apiKey, activity, signal }) };
  } catch (error) {
    if (!isRequestFailure(error)) return { kind: 'unexpected', error };
    return { kind: 'request-failed', code: intervalsErrorCode(error) };
  }
};

const isFatal = (code: IntervalsErrorCode): boolean =>
  code === 'rate-limited' || code === 'unauthorized';

const ingestActivity = async ({
  activity,
  data,
  profile,
  batcher,
  signal,
}: {
  activity: IntervalsActivity;
  data: ArrayBuffer;
  profile: UserProfile;
  batcher: ReturnType<typeof createIngestBatcher>;
  signal: AbortSignal | undefined;
}): Promise<boolean> => {
  try {
    const fileName = `${activity.id}.fit`;
    const result = await parseFitFile({
      arrayBuffer: data,
      fileName,
      profileAt: toFitParseProfile(profile),
      meta: {
        name: activity.name ?? undefined,
      },
    });
    if (signal?.aborted === true) return false;
    await batcher.add({
      ...result,
      rawData: data,
      fileName,
      source: { kind: 'intervals', activityId: activity.id },
    });
    return true;
  } catch {
    return false;
  }
};

// Downloads run up to DOWNLOAD_CONCURRENCY ahead; results are consumed in listing order, so
// parsing, duplicate checks and saving stay sequential.
const createDownloadWindow = ({
  apiKey,
  activities,
  signal,
}: {
  apiKey: string;
  activities: IntervalsActivity[];
  signal: AbortSignal | undefined;
}): { take: () => Promise<DownloadResult> | undefined; startNext: () => void } => {
  const inFlight: Promise<DownloadResult>[] = [];
  let started = 0;

  const startNext = (): void => {
    const activity = activities[started];
    if (activity === undefined) return;
    inFlight.push(downloadResult({ apiKey, activity, signal }));
    started++;
  };

  for (let slot = 0; slot < DOWNLOAD_CONCURRENCY; slot++) startNext();

  const take = (): Promise<DownloadResult> | undefined => inFlight.shift();

  return { take, startNext };
};

export const runIntervalsImport = async ({
  apiKey,
  profile,
  activities,
  onProgress,
  queryClient,
  markNewSince,
  onSaving,
  onChunkIngested,
  signal,
}: {
  apiKey: string;
  profile: UserProfile;
  activities: IntervalsActivity[];
  onProgress: (processed: number) => void;
  queryClient: QueryClient;
  markNewSince?: number;
  onSaving?: () => void;
  onChunkIngested: (activityIds: string[]) => void;
  signal?: AbortSignal;
}): Promise<IntervalsImportResult> => {
  let processed = 0;
  let failed = 0;
  let fatal: IntervalsErrorCode | undefined = undefined;

  const batcher = createIngestBatcher({
    queryClient,
    markNewSince,
    signal,
    onFlushed: (stored) => {
      const ids: string[] = [];
      for (const entry of stored) {
        if (entry.source.kind === 'intervals') ids.push(entry.source.activityId);
      }
      onChunkIngested(ids);
    },
  });

  const downloads = createDownloadWindow({ apiKey, activities, signal });
  for (const activity of activities) {
    const download = await downloads.take();
    if (download === undefined) break;
    signal?.throwIfAborted();
    if (download.kind === 'unexpected') throw download.error;
    if (download.kind === 'request-failed' && isFatal(download.code)) {
      fatal = download.code;
      break;
    }
    downloads.startNext();

    let ingested = false;
    if (download.kind === 'data') {
      ingested = await ingestActivity({
        activity,
        data: download.data,
        profile,
        batcher,
        signal,
      });
    }
    if (!ingested) failed++;

    processed++;
    onProgress(processed);
  }

  signal?.throwIfAborted();
  onSaving?.();
  const outcome = await batcher.finish();
  return {
    imported: outcome.importedCount,
    duplicated: outcome.duplicateCount,
    failed,
    fatal,
  };
};
