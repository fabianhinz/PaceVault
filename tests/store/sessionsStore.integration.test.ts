import { describe, it, expect } from 'vitest';
import { sessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { SESSIONS_DERIVATION_MARKER_KEY } from '@/lib/sessionsStorage.ts';
import { SESSION_DERIVATION_VERSION } from '@/packages/engine/sessionDerivation.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { getDB } from '@/lib/db';

describe('sessions store', () => {
  it('deleteSession removes it', () => {
    const { createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSessions([data]);
    const id = data.id;
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().deleteSession(id);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('addSessions batch-adds multiple sessions under the ids it is given', () => {
    const batch = [
      makeSession({ id: 'a' }),
      makeSession({ id: 'b', sport: 'running' }),
      makeSession({ id: 'c', sport: 'cycling' }),
    ];
    const inputs = batch.map(({ createdAt: _ca, ...data }) => data);

    useSessionsStore.getState().addSessions(inputs);

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(sessions.map((s) => s.sport)).toEqual(['cycling', 'running', 'cycling']);
  });

  it('does not badge added sessions as new unless asked to', () => {
    const { createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSessions([data]);
    useSessionsStore.getState().addSessions([data], { markNew: true });

    expect(useSessionsStore.getState().sessions.map((s) => s.isNew)).toEqual([false, true]);
  });

  it('addSessions with empty array is a no-op', () => {
    useSessionsStore.getState().addSessions([]);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('clearAll resets', () => {
    const { createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSessions([data]);

    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().clearAll();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('migrates version 1 sessions to file imports', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = migrate?.({ sessions: [{ id: 'a' }, { id: 'b' }] }, 1) as {
      sessions: Array<{ id: string; source: unknown }>;
    };
    expect(migrated.sessions).toEqual([
      { id: 'a', source: { kind: 'file' }, derivationVersion: 0 },
      { id: 'b', source: { kind: 'file' }, derivationVersion: 0 },
    ]);
  });

  it('keeps a session whose shape the migration does not recognise', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = migrate?.({ sessions: [{ id: 'a' }, 'garbage'] }, 1) as {
      sessions: unknown[];
    };
    expect(migrated.sessions).toEqual([
      { id: 'a', source: { kind: 'file' }, derivationVersion: 0 },
      'garbage',
    ]);
  });

  it('leaves an existing source alone during migration', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const source = { kind: 'demo' };
    const migrated = migrate?.({ sessions: [{ id: 'a', source }] }, 1) as {
      sessions: Array<{ source: unknown }>;
    };
    expect(migrated.sessions[0]?.source).toEqual(source);
  });

  it('marks version 2 sessions for reprocessing and keeps a known derivation version', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const source = { kind: 'file' };
    const migrated = migrate?.(
      { sessions: [{ id: 'a', source }, { id: 'b', source, derivationVersion: 1 }, 'garbage'] },
      2,
    ) as { sessions: unknown[] };
    expect(migrated.sessions).toEqual([
      { id: 'a', source, derivationVersion: 0 },
      { id: 'b', source, derivationVersion: 1 },
      'garbage',
    ]);
  });

  it('a tab holding outdated sessions does not overwrite the persisted sessions', async () => {
    const { createdAt: _ca, ...data } = makeSession({ id: 'a', isNew: true });
    useSessionsStore.getState().addSessions([data], { markNew: true });
    await sessionsStorage.flush();

    const stale = { ...useSessionsStore.getState().sessions[0], derivationVersion: 0 };
    useSessionsStore.setState({ sessions: [stale] });
    useSessionsStore.getState().markSessionSeen('a');
    await sessionsStorage.flush();

    const db = await getDB();
    const parsed = JSON.parse((await db.get('kv', 'store-sessions')) ?? '{}');
    expect(parsed.state.sessions[0]).toMatchObject({
      derivationVersion: SESSION_DERIVATION_VERSION,
      isNew: true,
    });
  });

  it('a tab on an older derivation version does not overwrite sessions a newer version wrote', async () => {
    const db = await getDB();
    await db.put('kv', String(SESSION_DERIVATION_VERSION + 1), SESSIONS_DERIVATION_MARKER_KEY);
    const before = await db.get('kv', 'store-sessions');
    try {
      const { createdAt: _ca, ...data } = makeSession();
      useSessionsStore.getState().addSessions([data]);
      await sessionsStorage.flush();

      expect(await db.get('kv', 'store-sessions')).toBe(before);
      expect(useSessionReprocessingStore.getState().newerVersionInOtherTab).toBe(true);
    } finally {
      await db.delete('kv', SESSIONS_DERIVATION_MARKER_KEY);
    }
  });

  it('persistence to IndexedDB', async () => {
    const { createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSessions([data]);

    await new Promise((r) => setTimeout(r, 50));

    const db = await getDB();
    const stored = await db.get('kv', 'store-sessions');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.state.sessions).toHaveLength(1);
  });
});
