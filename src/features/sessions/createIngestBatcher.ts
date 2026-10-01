import type { QueryClient } from '@tanstack/react-query';
import { useSessionsStore } from '@/store/sessions.ts';
import { invalidatePersonalBests } from '@/features/records/hooks/usePersonalBests.ts';
import { findDuplicates } from '@/lib/fingerprint.ts';
import { bulkSaveSessionData, saveFitFile } from '@/lib/indexeddb.ts';
import { requestPersistentStorage } from '@/lib/persistentStorage.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';

const CHUNK_SIZE = 10;
export const INGEST_BATCH_SIZE = 50;

interface IngestOutcome {
  importedCount: number;
  duplicateCount: number;
  saveFailed: boolean;
}

const ingestBatch = async (
  parsed: ParsedFitResultWithMeta[],
  markNew: boolean | undefined,
): Promise<IngestOutcome> => {
  const existingSessions = useSessionsStore.getState().sessions;
  const storeDups = findDuplicates(
    parsed.map((p) => p.fingerprint),
    existingSessions,
  );

  const seenInBatch = new Set<string>();
  let duplicateCount = 0;

  const unique = parsed.filter((p) => {
    if (storeDups.has(p.fingerprint) || seenInBatch.has(p.fingerprint)) {
      duplicateCount++;
      return false;
    }
    seenInBatch.add(p.fingerprint);
    return true;
  });

  if (unique.length === 0) {
    return { importedCount: 0, duplicateCount, saveFailed: false };
  }

  let saveFailed = false;

  try {
    const sessionIds = useSessionsStore.getState().addSessions(
      unique.map((p) => ({ ...p.session, source: p.source })),
      { markNew },
    );

    const idbEntries: Array<{ sessionId: string; records: SessionRecord[]; laps: SessionLap[] }> =
      [];

    for (let i = 0; i < unique.length; i++) {
      const entry = unique[i];
      const sessionId = sessionIds[i];
      if (!entry || !sessionId) continue;
      if (entry.records.length === 0) continue;

      idbEntries.push({ sessionId, records: entry.records, laps: entry.laps });
    }

    if (idbEntries.length > 0) {
      await bulkSaveSessionData(idbEntries, { chunkSize: CHUNK_SIZE });
    }

    for (let i = 0; i < unique.length; i++) {
      const sid = sessionIds[i];
      const u = unique[i];
      if (!sid || !u) continue;
      await saveFitFile(sid, u.fileName, u.rawData);
    }
  } catch (err) {
    console.error('Save error:', err);
    saveFailed = true;
  }

  return { importedCount: unique.length, duplicateCount, saveFailed };
};

export const createIngestBatcher = (options: {
  queryClient: QueryClient;
  markNew?: boolean;
  onFlushed?: (batch: ParsedFitResultWithMeta[]) => void;
}) => {
  let pending: ParsedFitResultWithMeta[] = [];
  const outcome: IngestOutcome = { importedCount: 0, duplicateCount: 0, saveFailed: false };

  const flush = async () => {
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    const result = await ingestBatch(batch, options.markNew);
    outcome.importedCount += result.importedCount;
    outcome.duplicateCount += result.duplicateCount;
    outcome.saveFailed ||= result.saveFailed;
    options.onFlushed?.(batch);
  };

  const add = async (entry: ParsedFitResultWithMeta) => {
    pending.push(entry);
    if (pending.length >= INGEST_BATCH_SIZE) await flush();
  };

  const finish = async (): Promise<IngestOutcome> => {
    await flush();
    if (outcome.importedCount > 0) {
      invalidatePersonalBests(options.queryClient);
      requestPersistentStorage().catch(() => undefined);
    }
    return outcome;
  };

  return { add, finish };
};
