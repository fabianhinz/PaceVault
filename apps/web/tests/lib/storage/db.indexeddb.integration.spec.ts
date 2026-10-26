import { describe, it, expect, beforeEach } from 'vite-plus/test';
import {
  getSessionRecords,
  deleteSessionRecords,
  clearAllRecords,
  getSessionLaps,
  deleteSessionLaps,
  saveSessionGPS,
  getSessionGPS,
  getAllSessionGPS,
  deleteSessionGPS,
  bulkSaveSessionData,
} from '@/lib/storage/db.ts';
import { cyclingRecordSeries, runningRecordSeries, lapSeries } from '@pacevault/testing/series.ts';
import { createMockSessionGPS } from '@pacevault/testing/gps.ts';

describe('IndexedDB session records', () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves 100 records and retrieves all by sessionId', async () => {
    const records = cyclingRecordSeries({ count: 100 });
    await bulkSaveSessionData([{ sessionId: 'session-a', records, laps: [] }]);

    const retrieved = await getSessionRecords('session-a');
    expect(retrieved).toHaveLength(100);
    expect(retrieved[0].power).toBeDefined();
  });

  it('retrieves only records for specific session (multi-session isolation)', async () => {
    const recordsA = cyclingRecordSeries({ count: 50 });
    const recordsB = runningRecordSeries({ count: 30 });
    await bulkSaveSessionData([{ sessionId: 'session-a', records: recordsA, laps: [] }]);
    await bulkSaveSessionData([{ sessionId: 'session-b', records: recordsB, laps: [] }]);

    const retrievedA = await getSessionRecords('session-a');
    const retrievedB = await getSessionRecords('session-b');

    expect(retrievedA).toHaveLength(50);
    expect(retrievedB).toHaveLength(30);
  });

  it('deletes records for one session, others remain', async () => {
    const recordsA = cyclingRecordSeries({ count: 40 });
    const recordsB = cyclingRecordSeries({ count: 60 });
    await bulkSaveSessionData([{ sessionId: 'session-a', records: recordsA, laps: [] }]);
    await bulkSaveSessionData([{ sessionId: 'session-b', records: recordsB, laps: [] }]);

    await deleteSessionRecords('session-a');

    const retrievedA = await getSessionRecords('session-a');
    const retrievedB = await getSessionRecords('session-b');

    expect(retrievedA).toHaveLength(0);
    expect(retrievedB).toHaveLength(60);
  });

  it('clearAllRecords wipes everything', async () => {
    await bulkSaveSessionData([
      { sessionId: 'session-a', records: cyclingRecordSeries({ count: 20 }), laps: [] },
    ]);
    await bulkSaveSessionData([
      { sessionId: 'session-b', records: cyclingRecordSeries({ count: 30 }), laps: [] },
    ]);

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
    const laps = lapSeries(5);
    await bulkSaveSessionData([{ sessionId: 'session-a', records: [], laps }]);

    const retrieved = await getSessionLaps('session-a');
    expect(retrieved).toHaveLength(5);
    expect(retrieved[0].lapIndex).toBe(0);
  });

  it('returns empty array for unknown sessionId', async () => {
    const retrieved = await getSessionLaps('nonexistent');
    expect(retrieved).toHaveLength(0);
  });

  it('retrieves only laps for specific session (multi-session isolation)', async () => {
    await bulkSaveSessionData([{ sessionId: 'session-a', records: [], laps: lapSeries(3) }]);
    await bulkSaveSessionData([{ sessionId: 'session-b', records: [], laps: lapSeries(5) }]);

    const retrievedA = await getSessionLaps('session-a');
    const retrievedB = await getSessionLaps('session-b');

    expect(retrievedA).toHaveLength(3);
    expect(retrievedB).toHaveLength(5);
  });

  it('deletes laps for one session, others remain', async () => {
    await bulkSaveSessionData([{ sessionId: 'session-a', records: [], laps: lapSeries(4) }]);
    await bulkSaveSessionData([{ sessionId: 'session-b', records: [], laps: lapSeries(6) }]);

    await deleteSessionLaps('session-a');

    const retrievedA = await getSessionLaps('session-a');
    const retrievedB = await getSessionLaps('session-b');

    expect(retrievedA).toHaveLength(0);
    expect(retrievedB).toHaveLength(6);
  });

  it('clearAllRecords also clears laps', async () => {
    await bulkSaveSessionData([
      { sessionId: 'session-a', records: cyclingRecordSeries({ count: 10 }), laps: lapSeries(3) },
    ]);

    await clearAllRecords();

    const laps = await getSessionLaps('session-a');
    const records = await getSessionRecords('session-a');
    expect(laps).toHaveLength(0);
    expect(records).toHaveLength(0);
  });
});

describe('IndexedDB session GPS', () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves and retrieves GPS data by sessionId', async () => {
    const gps = createMockSessionGPS({ sessionId: 'session-a' });
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
    await saveSessionGPS(createMockSessionGPS({ sessionId: 'session-a' }));
    await saveSessionGPS(createMockSessionGPS({ sessionId: 'session-b' }));

    const all = await getAllSessionGPS();
    expect(all).toHaveLength(2);
    const ids = all.map((g) => g.sessionId);
    expect(ids).toContain('session-a');
    expect(ids).toContain('session-b');
  });

  it('deletes GPS for one session, others remain', async () => {
    await saveSessionGPS(createMockSessionGPS({ sessionId: 'session-a' }));
    await saveSessionGPS(createMockSessionGPS({ sessionId: 'session-b' }));

    await deleteSessionGPS('session-a');

    const a = await getSessionGPS('session-a');
    const b = await getSessionGPS('session-b');
    expect(a).toBeUndefined();
    expect(b).toBeDefined();
  });

  it('clearAllRecords also clears GPS data', async () => {
    await saveSessionGPS(createMockSessionGPS({ sessionId: 'session-a' }));
    await bulkSaveSessionData([
      { sessionId: 'session-a', records: cyclingRecordSeries({ count: 5 }), laps: [] },
    ]);

    await clearAllRecords();

    const gps = await getSessionGPS('session-a');
    const records = await getSessionRecords('session-a');
    expect(gps).toBeUndefined();
    expect(records).toHaveLength(0);
  });
});

describe(bulkSaveSessionData.name, () => {
  beforeEach(async () => {
    await clearAllRecords();
  });

  it('saves records and laps for multiple sessions in chunked transactions', async () => {
    const entries = [
      {
        sessionId: 'session-a',
        records: cyclingRecordSeries({ count: 10 }),
        laps: lapSeries(2),
      },
      {
        sessionId: 'session-b',
        records: runningRecordSeries({ count: 15 }),
        laps: lapSeries(3),
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
        records: cyclingRecordSeries({ count: 5 }),
        laps: lapSeries(0),
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
      records: cyclingRecordSeries({ count: 3 }),
      laps: lapSeries(1),
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
      records: cyclingRecordSeries({ count: 2 }),
      laps: lapSeries(0),
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
