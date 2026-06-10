import type { SessionRecord, SessionLap, SessionGPS } from '@/packages/engine/types.ts';
import { getDB } from './db.ts';

const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = map.get(k);
    if (group) {
      group.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
};

export const saveSessionRecords = async (records: SessionRecord[]): Promise<void> => {
  if (records.length === 0) return;
  const db = await getDB();
  const grouped = groupBy(records, (r) => r.sessionId);
  const tx = db.transaction('session-records', 'readwrite');
  for (const [sessionId, sessionRecords] of grouped) {
    tx.store.put({ sessionId, records: sessionRecords });
  }
  await tx.done;
};

export const getSessionRecords = async (sessionId: string): Promise<SessionRecord[]> => {
  const db = await getDB();
  const blob = await db.get('session-records', sessionId);
  return blob?.records ?? [];
};

export const deleteSessionRecords = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('session-records', sessionId);
};

export const clearAllRecords = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('session-records');
  await db.clear('session-laps');
  await db.clear('session-gps');
  await db.clear('session-weather');
  await db.clear('fit-files');
  await db.clear('kv');
};

export const saveSessionLaps = async (laps: SessionLap[]): Promise<void> => {
  if (laps.length === 0) return;
  const db = await getDB();
  const grouped = groupBy(laps, (l) => l.sessionId);
  const tx = db.transaction('session-laps', 'readwrite');
  for (const [sessionId, sessionLaps] of grouped) {
    tx.store.put({ sessionId, laps: sessionLaps });
  }
  await tx.done;
};

export const getSessionLaps = async (sessionId: string): Promise<SessionLap[]> => {
  const db = await getDB();
  const blob = await db.get('session-laps', sessionId);
  return blob?.laps ?? [];
};

export const deleteSessionLaps = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('session-laps', sessionId);
};

export const saveSessionGPS = async (gps: SessionGPS): Promise<void> => {
  const db = await getDB();
  await db.add('session-gps', gps);
};

export const getSessionGPS = async (sessionId: string): Promise<SessionGPS | undefined> => {
  const db = await getDB();
  const results = await db.getAllFromIndex('session-gps', 'sessionId', sessionId);
  return results[0];
};

export const getAllSessionGPS = async (): Promise<SessionGPS[]> => {
  const db = await getDB();
  return db.getAll('session-gps');
};

export const deleteSessionGPS = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-gps', 'readwrite');
  const keys = await tx.store.index('sessionId').getAllKeys(sessionId);
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
};

export const bulkSaveSessionData = async (
  entries: Array<{
    records: (SessionRecord & { sessionId: string })[];
    laps: (SessionLap & { sessionId: string })[];
  }>,
  options?: { chunkSize?: number; onChunkDone?: (chunkIndex: number) => void },
): Promise<void> => {
  const size = options?.chunkSize ?? 10;
  const db = await getDB();

  for (let ci = 0; ci < entries.length; ci += size) {
    const chunk = entries.slice(ci, ci + size);
    const tx = db.transaction(['session-records', 'session-laps'], 'readwrite');
    const recordStore = tx.objectStore('session-records');
    const lapStore = tx.objectStore('session-laps');

    for (const entry of chunk) {
      if (entry.records.length > 0) {
        const grouped = groupBy(entry.records, (r) => r.sessionId);
        for (const [sessionId, records] of grouped) {
          recordStore.put({ sessionId, records });
        }
      }
      if (entry.laps.length > 0) {
        const grouped = groupBy(entry.laps, (l) => l.sessionId);
        for (const [sessionId, laps] of grouped) {
          lapStore.put({ sessionId, laps });
        }
      }
    }

    await tx.done;
    options?.onChunkDone?.(ci / size);
  }
};

export const getRecordsForSessions = async (
  sessionIds: string[],
): Promise<Map<string, SessionRecord[]>> => {
  const db = await getDB();
  const tx = db.transaction('session-records', 'readonly');
  const queries = sessionIds.map((id) => tx.store.get(id));
  const results = await Promise.all(queries);
  await tx.done;

  const map = new Map<string, SessionRecord[]>();
  for (let i = 0; i < sessionIds.length; i++) {
    const id = sessionIds[i];
    if (!id) continue;
    map.set(id, results[i]?.records ?? []);
  }
  return map;
};

export const saveFitFile = async (
  sessionId: string,
  fileName: string,
  data: ArrayBuffer,
): Promise<void> => {
  const db = await getDB();
  await db.put('fit-files', { sessionId, fileName, data });
};

export const getFitFile = async (
  sessionId: string,
): Promise<{ sessionId: string; fileName: string; data: ArrayBuffer } | undefined> => {
  const db = await getDB();
  return db.get('fit-files', sessionId);
};

export const deleteFitFile = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('fit-files', sessionId);
};

export const getAllFitFiles = async (): Promise<
  Array<{ sessionId: string; fileName: string; data: ArrayBuffer }>
> => {
  const db = await getDB();
  return db.getAll('fit-files');
};

export const getAllFitFileSessionIds = async (): Promise<string[]> => {
  const db = await getDB();
  return db.getAllKeys('fit-files');
};
