import { describe, it, expect, beforeEach } from 'vitest';
import { getDB, resetDBInstance } from '@/lib/db.ts';

describe('DB schema', () => {
  beforeEach(() => {
    resetDBInstance();
  });

  it('opens at version 3 with all expected stores', async () => {
    const db = await getDB();
    expect(db.version).toBe(3);
    expect(db.objectStoreNames.contains('session-records')).toBe(true);
    expect(db.objectStoreNames.contains('session-laps')).toBe(true);
    expect(db.objectStoreNames.contains('session-gps')).toBe(true);
    expect(db.objectStoreNames.contains('session-weather')).toBe(true);
    expect(db.objectStoreNames.contains('fit-files')).toBe(true);
    expect(db.objectStoreNames.contains('kv')).toBe(true);
  });

  it('session-records store uses sessionId keyPath (no indexes)', async () => {
    const db = await getDB();
    const tx = db.transaction('session-records', 'readonly');
    expect(tx.store.keyPath).toBe('sessionId');
    expect(Array.from(tx.store.indexNames)).toHaveLength(0);
  });

  it('session-laps store uses sessionId keyPath (no indexes)', async () => {
    const db = await getDB();
    const tx = db.transaction('session-laps', 'readonly');
    expect(tx.store.keyPath).toBe('sessionId');
    expect(Array.from(tx.store.indexNames)).toHaveLength(0);
  });

  it('session-gps store has sessionId index', async () => {
    const db = await getDB();
    const tx = db.transaction('session-gps', 'readonly');
    const indexNames = Array.from(tx.store.indexNames);
    expect(indexNames).toContain('sessionId');
  });

  it('kv store supports string key/value operations', async () => {
    const db = await getDB();
    await db.put('kv', '{"test":true}', 'my-key');
    const value = await db.get('kv', 'my-key');
    expect(value).toBe('{"test":true}');
  });

  it('getDB returns singleton (same promise)', () => {
    const p1 = getDB();
    const p2 = getDB();
    expect(p1).toBe(p2);
  });

  it('resetDBInstance allows new connection', async () => {
    const db1 = await getDB();
    resetDBInstance();
    const db2 = await getDB();
    expect(db1).not.toBe(db2);
  });
});
