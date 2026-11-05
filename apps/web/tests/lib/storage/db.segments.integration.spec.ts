import { afterEach, describe, expect, it } from 'vite-plus/test';
import { deleteDB, openDB } from 'idb';
import {
  DB_NAME,
  clearAllRecords,
  deleteSegmentPassesEntries,
  getDB,
  getSegmentPassesEntry,
  resetDBInstance,
  saveSegmentPassesEntry,
} from '@/lib/storage/db.ts';
import { createMockSessionLap } from '@pacevault/testing/records.ts';
import { createMockSegmentPassesEntry } from '@tests/factories/segments.ts';

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

describe('segment-passes store (IndexedDB)', () => {
  afterEach(async () => {
    (await getDB()).close();
    resetDBInstance();
    await deleteDB(DB_NAME);
  });

  it('keeps existing data when upgrading from version 4 to 5', async () => {
    (await getDB()).close();
    resetDBInstance();
    await deleteDB(DB_NAME);
    await seedVersion4();

    const db = await getDB();

    expect(db.version).toBe(5);
    expect(db.objectStoreNames.contains('segment-passes')).toBe(true);
    expect(await db.get('session-laps', 'session-1')).toEqual(LAPS_V4);
    expect(await db.get('kv', 'store-sessions')).toBe('persisted');
  });

  it('round-trips a passes entry', async () => {
    const entry = createMockSegmentPassesEntry({ segmentId: 'round-trip' });
    await saveSegmentPassesEntry(entry);

    expect(await getSegmentPassesEntry('round-trip')).toEqual(entry);
  });

  it('reads an invalid entry as undefined instead of throwing', async () => {
    const db = await getDB();
    await db.put('segment-passes', { segmentId: 'broken', passes: 'broken' });

    expect(await getSegmentPassesEntry('broken')).toBe(undefined);
  });

  it('deletes only the given entries', async () => {
    await saveSegmentPassesEntry(createMockSegmentPassesEntry({ segmentId: 'keep' }));
    await saveSegmentPassesEntry(createMockSegmentPassesEntry({ segmentId: 'drop-1' }));
    await saveSegmentPassesEntry(createMockSegmentPassesEntry({ segmentId: 'drop-2' }));

    await deleteSegmentPassesEntries(['drop-1', 'drop-2']);

    expect(await getSegmentPassesEntry('drop-1')).toBe(undefined);
    expect(await getSegmentPassesEntry('drop-2')).toBe(undefined);
    expect(await getSegmentPassesEntry('keep')).toEqual(
      createMockSegmentPassesEntry({ segmentId: 'keep' }),
    );
  });

  it('is cleared with all records', async () => {
    await saveSegmentPassesEntry(createMockSegmentPassesEntry({ segmentId: 'cleared' }));

    await clearAllRecords();

    expect(await getSegmentPassesEntry('cleared')).toBe(undefined);
  });
});
