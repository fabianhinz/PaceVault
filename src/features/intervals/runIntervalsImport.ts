import { listIntervalsActivities, downloadActivityFit } from '@/lib/intervals/activities.ts';
import { buildSyncPlan, preferOriginalFile, type SyncCandidate } from '@/lib/intervals/syncPlan.ts';
import { looksLikeFitFile } from '@/lib/intervals/fitSniff.ts';
import { mapWithConcurrency } from '@/lib/intervals/pool.ts';
import type { IntervalsErrorCode } from '@/lib/intervals/client.ts';
import type { IntervalsWindow } from '@/lib/intervals/intervalsDates.ts';
import { parseFitFile, isUnsupportedSportError } from '@/parsers/fit.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import { ingestParsedFits } from '@/features/sessions/ingestParsedFits.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import type { UserProfile } from '@/types/index.ts';

const IMPORT_BATCH_SIZE = 20;
const IMPORT_CONCURRENCY = 4;

interface IntervalsImportRequest {
  apiKey: string;
  profile: UserProfile;
  window: IntervalsWindow;
  knownActivityIds: string[];
  signal?: AbortSignal;
  onProgress?: (processed: number, total: number) => void;
}

export interface IntervalsImportResult {
  imported: number;
  duplicated: number;
  failed: number;
  unsupported: number;
  unavailable: number;
  alreadyImported: number;
  importedActivityIds: string[];
  fatal?: IntervalsErrorCode;
}

type ActivityOutcome =
  | { kind: 'parsed'; id: string; parsed: ParsedFitResultWithMeta }
  | { kind: 'unsupported'; id: string }
  | { kind: 'unavailable'; id: string }
  | { kind: 'failed'; id: string };

const emptyResult = (): IntervalsImportResult => ({
  imported: 0,
  duplicated: 0,
  failed: 0,
  unsupported: 0,
  unavailable: 0,
  alreadyImported: 0,
  importedActivityIds: [],
});

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const parseCandidate = async (
  candidate: SyncCandidate,
  bytes: ArrayBuffer,
  profile: UserProfile,
): Promise<ParsedFitResultWithMeta> => {
  const fileName = `${candidate.id}.fit`;
  const result = await parseFitFile(bytes, fileName, toFitParseProfile(profile), {
    name: candidate.name,
  });
  return { ...result, rawData: bytes, fileName };
};

const downloadAndParse = async (
  candidate: SyncCandidate,
  req: IntervalsImportRequest,
): Promise<ActivityOutcome> => {
  const wantsOriginal = preferOriginalFile(candidate.fileType);

  const first = await downloadActivityFit(req.apiKey, candidate.id, wantsOriginal, req.signal);
  if (!first.ok) {
    if (first.code === 'unavailable' || first.code === 'not-found') {
      return { kind: 'unavailable', id: candidate.id };
    }
    return { kind: 'failed', id: candidate.id };
  }

  if (looksLikeFitFile(first.data.data)) {
    try {
      return {
        kind: 'parsed',
        id: candidate.id,
        parsed: await parseCandidate(candidate, first.data.data, req.profile),
      };
    } catch (error) {
      if (isUnsupportedSportError(error)) return { kind: 'unsupported', id: candidate.id };
      if (first.data.endpoint === 'generated') {
        console.error('intervals.icu parse failed for activity', candidate.id);
        return { kind: 'failed', id: candidate.id };
      }
    }
  }

  if (first.data.endpoint === 'generated') {
    return { kind: 'unavailable', id: candidate.id };
  }

  const fallback = await downloadActivityFit(req.apiKey, candidate.id, false, req.signal);
  if (!fallback.ok) {
    if (fallback.code === 'unavailable' || fallback.code === 'not-found') {
      return { kind: 'unavailable', id: candidate.id };
    }
    return { kind: 'failed', id: candidate.id };
  }

  if (!looksLikeFitFile(fallback.data.data)) {
    return { kind: 'unavailable', id: candidate.id };
  }

  try {
    return {
      kind: 'parsed',
      id: candidate.id,
      parsed: await parseCandidate(candidate, fallback.data.data, req.profile),
    };
  } catch (error) {
    if (isUnsupportedSportError(error)) return { kind: 'unsupported', id: candidate.id };
    console.error('intervals.icu parse failed for activity', candidate.id);
    return { kind: 'failed', id: candidate.id };
  }
};

export const runIntervalsImport = async (
  req: IntervalsImportRequest,
): Promise<IntervalsImportResult> => {
  const result = emptyResult();

  const listing = await listIntervalsActivities(req.apiKey, req.window, req.signal);
  if (!listing.ok) {
    result.fatal = listing.code;
    return result;
  }

  const plan = buildSyncPlan({
    listing: listing.data.activities,
    knownActivityIds: req.knownActivityIds,
  });

  for (const entry of plan.skipped) {
    if (entry.reason === 'already-imported') result.alreadyImported++;
    if (entry.reason === 'unsupported-type') result.unsupported++;
    if (entry.reason === 'stub-source' || entry.reason === 'no-file') result.unavailable++;
  }

  const total = plan.toImport.length;
  let processed = 0;
  req.onProgress?.(processed, total);

  for (const batch of chunk(plan.toImport, IMPORT_BATCH_SIZE)) {
    if (req.signal?.aborted === true) break;

    const outcomes = await mapWithConcurrency(
      batch,
      IMPORT_CONCURRENCY,
      async (candidate) => {
        const outcome = await downloadAndParse(candidate, req);
        processed++;
        req.onProgress?.(processed, total);
        return outcome;
      },
      req.signal,
    );

    const parsed: ParsedFitResultWithMeta[] = [];
    const parsedIds: string[] = [];

    for (const outcome of outcomes) {
      if (outcome === undefined) continue;
      if (outcome.kind === 'parsed') {
        parsed.push(outcome.parsed);
        parsedIds.push(outcome.id);
      }
      if (outcome.kind === 'unsupported') result.unsupported++;
      if (outcome.kind === 'unavailable') result.unavailable++;
      if (outcome.kind === 'failed') result.failed++;
    }

    if (parsed.length === 0) continue;

    const ingested = await ingestParsedFits(parsed);
    result.imported += ingested.importedCount;
    result.duplicated += ingested.duplicateCount;
    if (ingested.saveFailed) result.failed += parsed.length;
    else result.importedActivityIds.push(...parsedIds);
  }

  return result;
};
