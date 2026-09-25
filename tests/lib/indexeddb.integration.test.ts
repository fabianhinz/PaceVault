import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSessionRecords,
  getSessionRecords,
  deleteSessionRecords,
  clearAllRecords,
  saveSessionLaps,
  getSessionLaps,
  deleteSessionLaps,
  saveSessionGPS,
  getSessionGPS,
  getAllSessionGPS,
  deleteSessionGPS,
  bulkSaveSessionData,
} from '@/lib/indexeddb.ts';
import { makeCyclingRecords, makeRunningRecords, makeLaps } from '@tests/factories/records.ts';
import { getDB } from '@/lib/db.ts';
import type { SessionGPS } from '@/packages/engine/types.ts';

describe('IndexedDB session records', () => {
  // Clear records between tests instead of deleting the database
  // (deleteDatabase blocks if a connection is still open)
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves 100 records and retrieves all by sessionId', async () => {
    const records = makeCyclingRecords(100);
    await saveSessionRecords('session-a', records);

    const retrieved = await getSessionRecords('session-a');
    expect(retrieved).toHaveLength(100);
    expect(retrieved[0].power).toBeDefined();
  });

  it('stores records compressed, keyed by the session', async () => {
    await saveSessionRecords('session-a', makeCyclingRecords(100));

    const db = await getDB();
    const stored = await db.get('session-records', 'session-a');
    expect(stored?.sessionId).toBe('session-a');
    expect(stored?.format).toBe('gzip-json');
  });

  it('retrieves only records for specific session (multi-session isolation)', async () => {
    const recordsA = makeCyclingRecords(50);
    const recordsB = makeRunningRecords(30);
    await saveSessionRecords('session-a', recordsA);
    await saveSessionRecords('session-b', recordsB);

    const retrievedA = await getSessionRecords('session-a');
    const retrievedB = await getSessionRecords('session-b');

    expect(retrievedA).toHaveLength(50);
    expect(retrievedB).toHaveLength(30);
  });

  it('deletes records for one session, others remain', async () => {
    const recordsA = makeCyclingRecords(40);
    const recordsB = makeCyclingRecords(60);
    await saveSessionRecords('session-a', recordsA);
    await saveSessionRecords('session-b', recordsB);

    await deleteSessionRecords('session-a');

    const retrievedA = await getSessionRecords('session-a');
    const retrievedB = await getSessionRecords('session-b');

    expect(retrievedA).toHaveLength(0);
    expect(retrievedB).toHaveLength(60);
  });

  it('clearAllRecords wipes everything', async () => {
    await saveSessionRecords('session-a', makeCyclingRecords(20));
    await saveSessionRecords('session-b', makeCyclingRecords(30));

    await clearAllRecords();

    const a = await getSessionRecords('session-a');
    const b = await getSessionRecords('session-b');
    expect(a).toHaveLength(0);
    expect(b).toHaveLength(0);
  });
});

describe('IndexedDB session laps', () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves laps and retrieves all by sessionId', async () => {
    const laps = makeLaps(5);
    await saveSessionLaps('session-a', laps);

    const retrieved = await getSessionLaps('session-a');
    expect(retrieved).toHaveLength(5);
    expect(retrieved[0].lapIndex).toBe(0);
  });

  it('returns empty array for unknown sessionId', async () => {
    const retrieved = await getSessionLaps('nonexistent');
    expect(retrieved).toHaveLength(0);
  });

  it('retrieves only laps for specific session (multi-session isolation)', async () => {
    await saveSessionLaps('session-a', makeLaps(3));
    await saveSessionLaps('session-b', makeLaps(5));

    const retrievedA = await getSessionLaps('session-a');
    const retrievedB = await getSessionLaps('session-b');

    expect(retrievedA).toHaveLength(3);
    expect(retrievedB).toHaveLength(5);
  });

  it('deletes laps for one session, others remain', async () => {
    await saveSessionLaps('session-a', makeLaps(4));
    await saveSessionLaps('session-b', makeLaps(6));

    await deleteSessionLaps('session-a');

    const retrievedA = await getSessionLaps('session-a');
    const retrievedB = await getSessionLaps('session-b');

    expect(retrievedA).toHaveLength(0);
    expect(retrievedB).toHaveLength(6);
  });

  it('clearAllRecords also clears laps', async () => {
    await saveSessionLaps('session-a', makeLaps(3));
    await saveSessionRecords('session-a', makeCyclingRecords(10));

    await clearAllRecords();

    const laps = await getSessionLaps('session-a');
    const records = await getSessionRecords('session-a');
    expect(laps).toHaveLength(0);
    expect(records).toHaveLength(0);
  });
});

const makeTestGPS = (sessionId: string): SessionGPS => ({
  sessionId,
  encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  pointCount: 3,
  bounds: { minLat: 38.5, maxLat: 40.7, minLng: -122.4, maxLng: -120.2 },
});

describe('IndexedDB session GPS', () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves and retrieves GPS data by sessionId', async () => {
    const gps = makeTestGPS('session-a');
    await saveSessionGPS(gps);

    const retrieved = await getSessionGPS('session-a');
    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe('session-a');
    expect(retrieved?.encodedPolyline).toBe(gps.encodedPolyline);
    expect(retrieved?.pointCount).toBe(3);
  });

  it('returns undefined for unknown sessionId', async () => {
    const retrieved = await getSessionGPS('nonexistent');
    expect(retrieved).toBeUndefined();
  });

  it('getAllSessionGPS returns all entries', async () => {
    await saveSessionGPS(makeTestGPS('session-a'));
    await saveSessionGPS(makeTestGPS('session-b'));

    const all = await getAllSessionGPS();
    expect(all).toHaveLength(2);
    const ids = all.map((g) => g.sessionId);
    expect(ids).toContain('session-a');
    expect(ids).toContain('session-b');
  });

  it('deletes GPS for one session, others remain', async () => {
    await saveSessionGPS(makeTestGPS('session-a'));
    await saveSessionGPS(makeTestGPS('session-b'));

    await deleteSessionGPS('session-a');

    const a = await getSessionGPS('session-a');
    const b = await getSessionGPS('session-b');
    expect(a).toBeUndefined();
    expect(b).toBeDefined();
  });

  it('clearAllRecords also clears GPS data', async () => {
    await saveSessionGPS(makeTestGPS('session-a'));
    await saveSessionRecords('session-a', makeCyclingRecords(5));

    await clearAllRecords();

    const gps = await getSessionGPS('session-a');
    const records = await getSessionRecords('session-a');
    expect(gps).toBeUndefined();
    expect(records).toHaveLength(0);
  });
});

describe('bulkSaveSessionData', () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves records and laps for multiple sessions in chunked transactions', async () => {
    const entries = [
      {
        sessionId: 'session-a',
        records: makeCyclingRecords(10),
        laps: makeLaps(2),
      },
      {
        sessionId: 'session-b',
        records: makeRunningRecords(15),
        laps: makeLaps(3),
      },
    ];

    await bulkSaveSessionData(entries);

    const recordsA = await getSessionRecords('session-a');
    const recordsB = await getSessionRecords('session-b');
    const lapsA = await getSessionLaps('session-a');
    const lapsB = await getSessionLaps('session-b');

    expect(recordsA).toHaveLength(10);
    expect(recordsB).toHaveLength(15);
    expect(lapsA).toHaveLength(2);
    expect(lapsB).toHaveLength(3);
  });

  it('handles entries with no laps', async () => {
    const entries = [
      {
        sessionId: 'session-a',
        records: makeCyclingRecords(5),
        laps: [] as ReturnType<typeof makeLaps>,
      },
    ];

    await bulkSaveSessionData(entries);

    const records = await getSessionRecords('session-a');
    const laps = await getSessionLaps('session-a');

    expect(records).toHaveLength(5);
    expect(laps).toHaveLength(0);
  });

  it('handles empty entries array', async () => {
    await bulkSaveSessionData([]);
    const all = await getAllSessionGPS();
    expect(all).toHaveLength(0);
  });

  it('calls onChunkDone for each chunk', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      sessionId: `session-${i}`,
      records: makeCyclingRecords(3),
      laps: makeLaps(1),
    }));

    const chunkIndices: number[] = [];
    await bulkSaveSessionData(entries, {
      chunkSize: 2,
      onChunkDone: (chunkIndex) => chunkIndices.push(chunkIndex),
    });

    expect(chunkIndices).toEqual([0, 1, 2]);

    // Verify all data was saved
    for (let i = 0; i < 5; i++) {
      const records = await getSessionRecords(`session-${i}`);
      expect(records).toHaveLength(3);
    }
  });

  it('respects custom chunkSize', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `session-${i}`,
      records: makeCyclingRecords(2),
      laps: [] as ReturnType<typeof makeLaps>,
      gps: null,
    }));

    const chunkIndices: number[] = [];
    await bulkSaveSessionData(entries, {
      chunkSize: 3,
      onChunkDone: (chunkIndex) => chunkIndices.push(chunkIndex),
    });

    // 10 entries / chunkSize 3 = chunks at indices 0, 1, 2, 3
    expect(chunkIndices).toEqual([0, 1, 2, 3]);

    // Verify all data was saved
    for (let i = 0; i < 10; i++) {
      const records = await getSessionRecords(`session-${i}`);
      expect(records).toHaveLength(2);
    }
  });
});
