import { describe, it, expect } from 'vitest';
import { useIntervalsStore } from '@/store/intervals.ts';
import { getDB } from '@/lib/db.ts';

describe('intervals store', () => {
  it('starts disconnected', () => {
    const state = useIntervalsStore.getState();
    expect(state.apiKey).toBeNull();
    expect(state.athleteFirstName).toBeNull();
    expect(state.lastSyncedAt).toBeNull();
    expect(state.importedActivityIds).toEqual([]);
  });

  it('connectIntervals stores the key and the athlete name', () => {
    useIntervalsStore.getState().connectIntervals('secret-key', 'Fabian');

    const state = useIntervalsStore.getState();
    expect(state.apiKey).toBe('secret-key');
    expect(state.athleteFirstName).toBe('Fabian');
  });

  it('connectIntervals tolerates an athlete without a first name', () => {
    useIntervalsStore.getState().connectIntervals('secret-key', null);
    expect(useIntervalsStore.getState().athleteFirstName).toBeNull();
  });

  it('recordIntervalsImported unions ids without duplicating them', () => {
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i2']);
    useIntervalsStore.getState().recordIntervalsImported(['i2', 'i3']);

    expect(useIntervalsStore.getState().importedActivityIds).toEqual(['i1', 'i2', 'i3']);
  });

  it('recordIntervalsImported does not touch the sync watermark', () => {
    useIntervalsStore.getState().recordIntervalsImported(['i1']);
    expect(useIntervalsStore.getState().lastSyncedAt).toBeNull();
  });

  it('markIntervalsSynced stamps the watermark independently of the ids', () => {
    useIntervalsStore.getState().markIntervalsSynced(2000);

    const state = useIntervalsStore.getState();
    expect(state.lastSyncedAt).toBe(2000);
    expect(state.importedActivityIds).toEqual([]);
  });

  it('recordIntervalsImported dedupes ids repeated within one call', () => {
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i1', 'i1']);
    expect(useIntervalsStore.getState().importedActivityIds).toEqual(['i1']);
  });

  it('recordIntervalsImported caps the tracked id list', () => {
    const many = Array.from({ length: 20050 }, (_, i) => `i${i}`);
    useIntervalsStore.getState().recordIntervalsImported(many);

    const ids = useIntervalsStore.getState().importedActivityIds;
    expect(ids).toHaveLength(20000);
    expect(ids.at(-1)).toBe('i20049');
  });

  it('disconnectIntervals clears the key and the id set, so a new athlete starts clean', () => {
    useIntervalsStore.getState().connectIntervals('secret-key', 'Fabian');
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i2']);
    useIntervalsStore.getState().markIntervalsSynced(1000);

    useIntervalsStore.getState().disconnectIntervals();

    expect(useIntervalsStore.getState()).toMatchObject({
      apiKey: null,
      athleteFirstName: null,
      lastSyncedAt: null,
      importedActivityIds: [],
    });
  });

  it('round-trips through the kv store in IndexedDB', async () => {
    useIntervalsStore.getState().connectIntervals('secret-key', 'Fabian');
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i2']);
    useIntervalsStore.getState().markIntervalsSynced(1700000000000);

    await useIntervalsStore.persist.rehydrate();

    const db = await getDB();
    const raw = await db.get('kv', 'store-intervals');
    expect(raw).toBeTruthy();

    const parsed: unknown = JSON.parse(String(raw));
    expect(parsed).toMatchObject({
      state: {
        apiKey: 'secret-key',
        athleteFirstName: 'Fabian',
        lastSyncedAt: 1700000000000,
        importedActivityIds: ['i1', 'i2'],
      },
      version: 1,
    });
  });
});
