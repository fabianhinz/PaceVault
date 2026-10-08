import type { QueryClient } from '@tanstack/react-query';
import { v4 } from 'uuid';
import { useSessionsStore } from '@/store/sessions.ts';
import { invalidatePersonalBests } from '@/features/records/hooks/usePersonalBests.ts';
import { findDuplicates } from '@/lib/fingerprint.ts';
import { bulkSaveSessionData } from '@/lib/indexeddb.ts';
import { requestPersistentStorage } from '@/lib/persistentStorage.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';

const CHUNK_SIZE = 10;
export const INGEST_BATCH_SIZE = 50;

interface IngestOutcome {
  importedCount: number;
  duplicateCount: number;
  saveFailed: boolean;
}

interface BatchOutcome extends IngestOutcome {
  stored: ParsedFitResultWithMeta[];
}

const ingestBatch = async (
  parsed: ParsedFitResultWithMeta[],
  markNew: boolean | undefined,
): Promise<BatchOutcome> => {
  const existingSessions = useSessionsStore.getState().sessions;
  const storeDups = findDuplicates(
    parsed.map((p) => p.fingerprint),
    existingSessions,
  );

  const seenInBatch = new Set<string>();
  const duplicates: ParsedFitResultWithMeta[] = [];

  const unique = parsed.filter((p) => {
    if (storeDups.has(p.fingerprint) || seenInBatch.has(p.fingerprint)) {
      duplicates.push(p);
      return false;
    }
    seenInBatch.add(p.fingerprint);
    return true;
  });

  if (unique.length === 0) {
    return {
      importedCount: 0,
      duplicateCount: duplicates.length,
      saveFailed: false,
      stored: duplicates,
    };
  }

  const withIds = unique.map((entry) => ({ id: v4(), entry }));
  const idbEntries = withIds.map((item) => {
    let records = item.entry.records;
    let laps = item.entry.laps;
    if (records.length === 0) {
      records = [];
      laps = [];
    }
    return {
      sessionId: item.id,
      records,
      laps,
      fit: { fileName: item.entry.fileName, data: item.entry.rawData },
    };
  });

  let savedCount = 0;
  let saveFailed = false;
  try {
    await bulkSaveSessionData(idbEntries, {
      chunkSize: CHUNK_SIZE,
      onChunkDone: (chunkIndex) => {
        savedCount = Math.min((chunkIndex + 1) * CHUNK_SIZE, withIds.length);
      },
    });
  } catch (err) {
    console.error('Save error:', err);
    saveFailed = true;
  }

  const saved = withIds.slice(0, savedCount);
  if (saved.length > 0) {
    useSessionsStore.getState().addSessions(
      saved.map((item) => ({ ...item.entry.session, id: item.id, source: item.entry.source })),
      { markNew },
    );
  }

  return {
    importedCount: saved.length,
    duplicateCount: duplicates.length,
    saveFailed,
    stored: [...duplicates, ...saved.map((item) => item.entry)],
  };
};

export const createIngestBatcher = (options: {
  queryClient: QueryClient;
  markNew?: boolean;
  onFlushed?: (stored: ParsedFitResultWithMeta[]) => void;
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
    options.onFlushed?.(result.stored);
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
