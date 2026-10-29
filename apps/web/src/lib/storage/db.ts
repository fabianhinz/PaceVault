import { openDB, type DBSchema, type IDBPDatabase, type StoreNames } from 'idb';
import type { StateStorage } from 'zustand/middleware';
import type { SessionRecord, SessionLap, SessionGPS } from '@pacevault/engine/types.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { SessionWeather } from '@/types.ts';
import { decodeRecords, encodeRecords, type EncodedRecords } from './recordCodec.ts';

export interface EnduranceTrackerDB extends DBSchema {
  'session-records': {
    key: string;
    value: { sessionId: string } & EncodedRecords;
  };
  'session-laps': {
    key: string;
    value: { sessionId: string; laps: SessionLap[] };
  };
  'session-gps': {
    key: number;
    value: SessionGPS;
    indexes: { sessionId: string };
  };
  'session-weather': {
    key: string;
    value: SessionWeather;
  };
  'fit-files': {
    key: string;
    value: { sessionId: string; fileName: string; data: ArrayBuffer };
  };
  'studio-route-points': {
    key: string;
    value: { routeId: string; points: RoutePoint[] };
  };
  kv: {
    key: string;
    value: string;
  };
}

export const DB_NAME = 'endurance-tracker';
export const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<EnduranceTrackerDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<EnduranceTrackerDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<EnduranceTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('session-records', { keyPath: 'sessionId' });
          db.createObjectStore('session-laps', { keyPath: 'sessionId' });
          db.createObjectStore('kv');
          const gpsStore = db.createObjectStore('session-gps', {
            autoIncrement: true,
          });
          gpsStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (oldVersion < 2) {
          db.createObjectStore('fit-files', { keyPath: 'sessionId' });
        }
        if (oldVersion < 3) {
          db.createObjectStore('session-weather', { keyPath: 'sessionId' });
        }
        if (oldVersion < 4) {
          db.createObjectStore('studio-route-points', { keyPath: 'routeId' });
        }
      },
    });
  }
  return dbPromise;
};

export const resetDBInstance = (): void => {
  dbPromise = null;
};

export const getSessionRecords = async (sessionId: string): Promise<SessionRecord[]> => {
  const db = await getDB();
  const records = decodeRecords(await db.get('session-records', sessionId));
  return records;
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
  await db.clear('studio-route-points');
  await db.clear('kv');
};

export const saveStudioRoutePoints = async ({
  routeId,
  points,
}: {
  routeId: string;
  points: RoutePoint[];
}): Promise<void> => {
  const db = await getDB();
  await db.put('studio-route-points', { routeId, points });
};

export const getStudioRoutePoints = async (routeId: string): Promise<RoutePoint[]> => {
  const db = await getDB();
  const blob = await db.get('studio-route-points', routeId);
  return blob?.points ?? [];
};

export const deleteStudioRoutePoints = async (routeId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('studio-route-points', routeId);
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
  await Promise.all(keys.map((key) => tx.store.delete(key)));
  await tx.done;
};

interface SessionDataEntry {
  sessionId: string;
  records: SessionRecord[];
  laps: SessionLap[];
  fit?: { fileName: string; data: ArrayBuffer };
}

export const bulkSaveSessionData = async (
  entries: SessionDataEntry[],
  options?: { chunkSize?: number; onChunkDone?: (chunkIndex: number) => void },
): Promise<void> => {
  const size = options?.chunkSize ?? 10;
  const db = await getDB();

  for (let ci = 0; ci < entries.length; ci += size) {
    const chunk = entries.slice(ci, ci + size);
    const encoded = await Promise.all(
      chunk.map(async (entry) => {
        if (entry.records.length === 0) return null;
        return encodeRecords(entry.records);
      }),
    );

    const tx = db.transaction(['session-records', 'session-laps', 'fit-files'], 'readwrite');
    const recordStore = tx.objectStore('session-records');
    const lapStore = tx.objectStore('session-laps');
    const fitStore = tx.objectStore('fit-files');

    const writes: Promise<unknown>[] = [];
    try {
      chunk.forEach((entry, i) => {
        const records = encoded[i];
        if (records) writes.push(recordStore.put({ sessionId: entry.sessionId, ...records }));
        if (entry.laps.length > 0) {
          writes.push(lapStore.put({ sessionId: entry.sessionId, laps: entry.laps }));
        }
        if (entry.fit) writes.push(fitStore.put({ sessionId: entry.sessionId, ...entry.fit }));
      });
    } catch (err) {
      tx.abort();
      await Promise.allSettled([...writes, tx.done]);
      throw err;
    }

    await Promise.all([...writes, tx.done]);
    options?.onChunkDone?.(ci / size);
  }
};

export const bulkReplaceSessionData = async (
  entries: Omit<SessionDataEntry, 'fit'>[],
): Promise<void> => {
  const encoded = await Promise.all(
    entries.map(async (entry) => {
      if (entry.records.length === 0) return null;
      return encodeRecords(entry.records);
    }),
  );
  const db = await getDB();
  const tx = db.transaction(['session-records', 'session-laps', 'session-gps'], 'readwrite');
  const recordStore = tx.objectStore('session-records');
  const lapStore = tx.objectStore('session-laps');
  const gpsIndex = tx.objectStore('session-gps').index('sessionId');

  const writes = entries.map(async (entry, i) => {
    const records = encoded[i];
    if (records) await recordStore.put({ sessionId: entry.sessionId, ...records });
    else await recordStore.delete(entry.sessionId);
    if (entry.laps.length > 0) await lapStore.put({ sessionId: entry.sessionId, laps: entry.laps });
    else await lapStore.delete(entry.sessionId);
    let cursor = await gpsIndex.openCursor(entry.sessionId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  });
  await Promise.all([...writes, tx.done]);
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

export const getFitFileSessionIds = async (): Promise<string[]> => {
  const db = await getDB();
  return db.getAllKeys('fit-files');
};

export type IdbStoreName = StoreNames<EnduranceTrackerDB>;

const binaryBytes = (value: unknown): number | undefined => {
  if (typeof value !== 'object' || value === null || !('byteLength' in value)) return undefined;
  if (typeof value.byteLength !== 'number') return undefined;
  return value.byteLength;
};

const valueBytes = (value: unknown): number => {
  if (typeof value === 'string') return value.length;
  const binary = binaryBytes(value);
  if (binary !== undefined) return binary;
  if (typeof value === 'object' && value !== null && 'data' in value) {
    const data = binaryBytes(value.data);
    if (data !== undefined) return data;
  }
  return JSON.stringify(value)?.length ?? 0;
};

const measureStore = async (store: IdbStoreName): Promise<number> => {
  const db = await getDB();
  let total = 0;
  let cursor = await db.transaction(store).store.openCursor();
  while (cursor) {
    total += valueBytes(cursor.value);
    cursor = await cursor.continue();
  }
  return total;
};

export const measureStoreBytes = async (): Promise<Partial<Record<IdbStoreName, number>>> => {
  const db = await getDB();
  const sizes: Partial<Record<IdbStoreName, number>> = {};
  for (const store of Array.from(db.objectStoreNames)) {
    sizes[store] = await measureStore(store);
  }
  return sizes;
};

export const idbStorage: StateStorage = {
  async getItem(name: string): Promise<string | null> {
    const db = await getDB();
    return (await db.get('kv', name)) ?? null;
  },
  async setItem(name: string, value: string): Promise<void> {
    const db = await getDB();
    await db.put('kv', value, name);
  },
  async removeItem(name: string): Promise<void> {
    const db = await getDB();
    await db.delete('kv', name);
  },
};

export const getSessionWeather = async (sessionId: string): Promise<SessionWeather | undefined> => {
  const db = await getDB();
  return db.get('session-weather', sessionId);
};

export const saveSessionWeather = async (weather: SessionWeather): Promise<void> => {
  const db = await getDB();
  await db.put('session-weather', weather);
};

export const deleteSessionWeather = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('session-weather', sessionId);
};
