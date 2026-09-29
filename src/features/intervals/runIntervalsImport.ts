import type { QueryClient } from '@tanstack/react-query';
import {
  downloadActivityFit,
  type IntervalsActivity,
  type IntervalsErrorCode,
} from '@/lib/intervals.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { createIngestBatcher } from '@/features/sessions/createIngestBatcher.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import type { UserProfile } from '@/types/index.ts';

export interface IntervalsImportResult {
  imported: number;
  duplicated: number;
  fatal?: IntervalsErrorCode;
}

export const runIntervalsImport = async (
  apiKey: string,
  profile: UserProfile,
  activities: IntervalsActivity[],
  onProgress: (processed: number) => void,
  options: {
    queryClient: QueryClient;
    markNew?: boolean;
    onChunkIngested: (activityIds: string[]) => void;
  },
): Promise<IntervalsImportResult> => {
  let processed = 0;
  let fatal: IntervalsErrorCode | undefined = undefined;

  const batcher = createIngestBatcher({
    queryClient: options.queryClient,
    markNew: options.markNew,
    onFlushed: (batch) => {
      const ids: string[] = [];
      for (const entry of batch) {
        if (entry.source.kind === 'intervals') ids.push(entry.source.activityId);
      }
      options.onChunkIngested(ids);
    },
  });

  for (const activity of activities) {
    const download = await downloadActivityFit(apiKey, activity);

    if (!download.ok) {
      if (download.code === 'rate-limited' || download.code === 'unauthorized') {
        fatal = download.code;
        break;
      }
    } else {
      try {
        const fileName = `${activity.id}.fit`;
        const result = await parseFitFile(download.data, fileName, toFitParseProfile(profile), {
          name: activity.name ?? undefined,
        });
        await batcher.add({
          ...result,
          rawData: download.data,
          fileName,
          source: { kind: 'intervals', activityId: activity.id },
        });
      } catch {
        /* empty */
      }
    }

    processed++;
    onProgress(processed);
  }

  const outcome = await batcher.finish();
  return { imported: outcome.importedCount, duplicated: outcome.duplicateCount, fatal };
};
