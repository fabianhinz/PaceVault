import {
  downloadActivityFit,
  type IntervalsActivity,
  type IntervalsErrorCode,
} from '@/lib/intervals.ts';
import { parseFitFile, type ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import { ingestParsedFits } from '@/features/sessions/ingestParsedFits.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import type { UserProfile } from '@/types/index.ts';

export interface IntervalsImportResult {
  imported: number;
  duplicated: number;
  importedActivityIds: string[];
  fatal?: IntervalsErrorCode;
}

export const runIntervalsImport = async (
  apiKey: string,
  profile: UserProfile,
  activities: IntervalsActivity[],
  onProgress: (processed: number) => void,
  options?: { markNew?: boolean },
): Promise<IntervalsImportResult> => {
  const parsed: ParsedFitResultWithMeta[] = [];
  const parsedIds: string[] = [];
  let processed = 0;
  let fatal: IntervalsErrorCode | undefined = undefined;

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
        parsed.push({ ...result, rawData: download.data, fileName });
        parsedIds.push(activity.id);
      } catch {
        /* empty */
      }
    }

    processed++;
    onProgress(processed);
  }

  if (parsed.length === 0) {
    return { imported: 0, duplicated: 0, importedActivityIds: [], fatal };
  }

  const ingested = await ingestParsedFits(parsed, { markNew: options?.markNew });
  return {
    imported: ingested.importedCount,
    duplicated: ingested.duplicateCount,
    importedActivityIds: parsedIds,
    fatal,
  };
};
