import { useSessionsStore } from '@/store/sessions.ts';
import { usePersonalBestsStore } from '@/store/personalBests.ts';
import { findDuplicates } from '@/lib/fingerprint.ts';
import { bulkSaveSessionData, saveFitFile } from '@/lib/indexeddb.ts';
import { requestPersistentStorage } from '@/lib/persistentStorage.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';

const CHUNK_SIZE = 10;

interface IngestOutcome {
  sessionIds: string[];
  importedCount: number;
  duplicateCount: number;
  saveFailed: boolean;
}

export const ingestParsedFits = async (
  parsed: ParsedFitResultWithMeta[],
  options?: { markNew?: boolean },
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
    return { sessionIds: [], importedCount: 0, duplicateCount, saveFailed: false };
  }

  let sessionIds: string[] = [];
  let saveFailed = false;

  try {
    sessionIds = useSessionsStore.getState().addSessions(
      unique.map((p) => ({ ...p.session, source: p.source })),
      { markNew: options?.markNew },
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

    usePersonalBestsStore.getState().addSessionPBs(
      unique.flatMap((u, i) => {
        const sessionId = sessionIds[i];
        if (!sessionId || u.records.length === 0) return [];
        return [
          {
            sessionId,
            date: u.session.date,
            sport: u.session.sport,
            records: u.records,
            distance: u.session.distance,
            elevationGain: u.session.elevationGain,
          },
        ];
      }),
    );

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

  const importedCount = unique.length;
  if (importedCount > 0) requestPersistentStorage().catch(() => undefined);

  return { sessionIds, importedCount, duplicateCount, saveFailed };
};
