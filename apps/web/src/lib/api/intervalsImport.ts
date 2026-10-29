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

export const runIntervalsImport = async ({
  apiKey,
  profile,
  activities,
  onProgress,
  queryClient,
  markNew,
  onSaving,
  onChunkIngested,
}: {
  apiKey: string;
  profile: UserProfile;
  activities: IntervalsActivity[];
  onProgress: (processed: number) => void;
  queryClient: QueryClient;
  markNew?: boolean;
  onSaving?: () => void;
  onChunkIngested: (activityIds: string[]) => void;
}): Promise<IntervalsImportResult> => {
  let processed = 0;
  let failed = 0;
  let fatal: IntervalsErrorCode | undefined = undefined;

  const batcher = createIngestBatcher({
    queryClient,
    markNew,
    onFlushed: (stored) => {
      const ids: string[] = [];
      for (const entry of stored) {
        if (entry.source.kind === 'intervals') ids.push(entry.source.activityId);
      }
      onChunkIngested(ids);
    },
  });

  for (const activity of activities) {
    let data: ArrayBuffer | undefined = undefined;
    try {
      data = await downloadActivityFit({ apiKey, activity });
    } catch (error) {
      const requestFailed =
        error instanceof FailedResponseError ||
        error instanceof TypeError ||
        error instanceof DOMException;
      if (!requestFailed) throw error;
      const code = intervalsErrorCode(error);
      if (code === 'rate-limited' || code === 'unauthorized') {
        fatal = code;
        break;
      }
      failed++;
    }

    if (data !== undefined) {
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
        await batcher.add({
          ...result,
          rawData: data,
          fileName,
          source: { kind: 'intervals', activityId: activity.id },
        });
      } catch {
        failed++;
      }
    }

    processed++;
    onProgress(processed);
  }

  onSaving?.();
  const outcome = await batcher.finish();
  return {
    imported: outcome.importedCount,
    duplicated: outcome.duplicateCount,
    failed,
    fatal,
  };
};
