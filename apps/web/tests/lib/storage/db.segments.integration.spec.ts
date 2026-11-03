import { afterEach, describe, expect, it } from 'vite-plus/test';
import { deleteDB, openDB } from 'idb';
import {
  DB_NAME,
  getDB,
  getStoredSegments,
  resetDBInstance,
  saveStoredSegments,
} from '@/lib/storage/db.ts';
import { createMockSessionLap } from '@pacevault/testing/records.ts';
import { createMockStoredSegments } from '@tests/factories/segments.ts';

const LAPS_V4 = { sessionId: 'session-1', laps: [createMockSessionLap()] };

const seedVersion4 = async (): Promise<void> => {
  const db = await openDB(DB_NAME, 4, {
    upgrade(database) {
      database.createObjectStore('session-records', { keyPath: 'sessionId' });
      database.createObjectStore('session-laps', { keyPath: 'sessionId' });
      database.createObjectStore('kv');
    },
  });
  await db.put('session-laps', LAPS_V4);
  await db.put('kv', 'persisted', 'store-sessions');
  db.close();
};

describe('segments store (IndexedDB)', () => {
  afterEach(async () => {
    (await getDB()).close();
    resetDBInstance();
  });

  it('keeps existing data when upgrading from version 4 to 5', async () => {
    (await getDB()).close();
    resetDBInstance();
    await deleteDB(DB_NAME);
    await seedVersion4();

    const db = await getDB();

    expect(db.version).toBe(5);
    expect(db.objectStoreNames.contains('segments')).toBe(true);
    expect(await db.get('session-laps', 'session-1')).toEqual(LAPS_V4);
    expect(await db.get('kv', 'store-sessions')).toBe('persisted');
  });

  it('drops an invalid stored entry instead of throwing', async () => {
    const valid = createMockStoredSegments({ sport: 'cycling' });
    await saveStoredSegments(valid);
    const db = await getDB();
    await db.put('segments', { sport: 'running', segments: 'broken' });

    expect(await getStoredSegments()).toEqual([valid]);
  });
});
