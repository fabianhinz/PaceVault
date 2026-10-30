import type { QueryClient } from '@tanstack/react-query';
import { v4 } from 'uuid';
import { useSessionsStore } from '@/store/sessions.ts';
import { invalidatePersonalBests } from '@/queries/records/usePersonalBests.ts';
import { findDuplicates } from '@/parsers/fingerprint.ts';
import { bulkSaveSessionData } from '@/lib/storage/db.ts';
import { requestPersistentStorage } from '@/lib/storage/persistentStorage.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';

export const INGEST_CHUNK_SIZE = 10;
export const INGEST_BATCH_SIZE = 50;

interface IngestOutcome {
  importedCount: number;
  duplicateCount: number;
  saveFailed: boolean;
}

interface BatchOutcome extends IngestOutcome {
  stored: ParsedFitResultWithMeta[];
}

const partitionDuplicates = ({
  parsed,
  existingSessions,
}: {
  parsed: ParsedFitResultWithMeta[];
  existingSessions: TrainingSession[];
}): { unique: ParsedFitResultWithMeta[]; duplicates: ParsedFitResultWithMeta[] } => {
  const storeDups = findDuplicates({
    fingerprints: parsed.map((p) => p.fingerprint),
    existingSessions,
  });

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
  return { unique, duplicates };
};

interface IdentifiedEntry {
  id: string;
  entry: ParsedFitResultWithMeta;
}

type TrainingSessionInput = Omit<TrainingSession, 'createdAt' | 'isNew'>;

const saveSessionData = async ({
  withIds,
  signal,
}: {
  withIds: IdentifiedEntry[];
  signal: AbortSignal | undefined;
}): Promise<{ savedCount: number; saveFailed: boolean }> => {
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
      chunkSize: INGEST_CHUNK_SIZE,
      signal,
      onChunkDone: (chunkIndex) => {
        savedCount = Math.min((chunkIndex + 1) * INGEST_CHUNK_SIZE, withIds.length);
      },
    });
  } catch (err) {
    if (signal?.aborted === true) return { savedCount: 0, saveFailed: false };
    console.error('Save error:', err);
    saveFailed = true;
  }
  return { savedCount, saveFailed };
};

const addSavedSessions = ({
  saved,
  markNewSince,
}: {
  saved: IdentifiedEntry[];
  markNewSince: number | undefined;
}): void => {
  const recent: TrainingSessionInput[] = [];
  const older: TrainingSessionInput[] = [];
  for (const item of saved) {
    const session = { ...item.entry.session, id: item.id, source: item.entry.source };
    if (markNewSince !== undefined && session.date >= markNewSince) recent.push(session);
    else older.push(session);
  }
  if (recent.length > 0)
    useSessionsStore.getState().addSessions({ sessions: recent, markNew: true });
  if (older.length > 0) useSessionsStore.getState().addSessions({ sessions: older });
};

const ingestBatch = async ({
  parsed,
  markNewSince,
  signal,
}: {
  parsed: ParsedFitResultWithMeta[];
  markNewSince: number | undefined;
  signal: AbortSignal | undefined;
}): Promise<BatchOutcome> => {
  const partition = partitionDuplicates({
    parsed,
    existingSessions: useSessionsStore.getState().sessions,
  });
  const duplicates = partition.duplicates;

  if (partition.unique.length === 0) {
    return {
      importedCount: 0,
      duplicateCount: duplicates.length,
      saveFailed: false,
      stored: duplicates,
    };
  }

  const withIds = partition.unique.map((entry) => ({ id: v4(), entry }));
  const saveResult = await saveSessionData({ withIds, signal });
  if (signal?.aborted === true) {
    return { importedCount: 0, duplicateCount: 0, saveFailed: false, stored: [] };
  }

  const saved = withIds.slice(0, saveResult.savedCount);
  addSavedSessions({ saved, markNewSince });

  return {
    importedCount: saved.length,
    duplicateCount: duplicates.length,
    saveFailed: saveResult.saveFailed,
    stored: [...duplicates, ...saved.map((item) => item.entry)],
  };
};

export const createIngestBatcher = (options: {
  queryClient: QueryClient;
  markNewSince?: number;
  onFlushed?: (stored: ParsedFitResultWithMeta[]) => void;
  signal?: AbortSignal;
}) => {
  let pending: ParsedFitResultWithMeta[] = [];
  const outcome: IngestOutcome = { importedCount: 0, duplicateCount: 0, saveFailed: false };

  const flush = async () => {
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    const result = await ingestBatch({
      parsed: batch,
      markNewSince: options.markNewSince,
      signal: options.signal,
    });
    if (options.signal?.aborted === true) return;
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
      void invalidatePersonalBests(options.queryClient);
      void requestPersistentStorage();
    }
    return outcome;
  };

  return { add, finish };
};
