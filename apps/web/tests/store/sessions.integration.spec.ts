import { describe, it, expect } from 'vite-plus/test';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { SESSIONS_DERIVATION_MARKER_KEY } from '@/lib/guardedSessionsStorage.ts';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { listOrThrow, recordOrThrow } from '@testUtils/defined.ts';
import { getDB } from '@/lib/db';

describe('sessions store', () => {
  it('deleteSession removes it', () => {
    const { createdAt: _ca, ...data } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [data] });
    const id = data.id;
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().deleteSession(id);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('addSessions batch-adds multiple sessions under the ids it is given', () => {
    const batch = [
      createMockTrainingSession({ id: 'a' }),
      createMockTrainingSession({ id: 'b', sport: 'running' }),
      createMockTrainingSession({ id: 'c', sport: 'cycling' }),
    ];
    const inputs = batch.map(({ createdAt: _ca, ...data }) => data);

    useSessionsStore.getState().addSessions({ sessions: inputs });

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(sessions.map((s) => s.sport)).toEqual(['cycling', 'running', 'cycling']);
  });

  it('does not badge added sessions as new unless asked to', () => {
    const { createdAt: _ca, ...data } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [data] });
    useSessionsStore.getState().addSessions({ sessions: [data], markNew: true });

    expect(useSessionsStore.getState().sessions.map((s) => s.isNew)).toEqual([false, true]);
  });

  it('addSessions with empty array is a no-op', () => {
    useSessionsStore.getState().addSessions({ sessions: [] });
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('clearAll resets', () => {
    const { createdAt: _ca, ...data } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [data] });

    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().clearAll();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('migrates version 1 sessions to file imports', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = recordOrThrow(migrate?.({ sessions: [{ id: 'a' }, { id: 'b' }] }, 1));
    expect(migrated.sessions).toEqual([
      { id: 'a', source: { kind: 'file' }, derivationVersion: 0 },
      { id: 'b', source: { kind: 'file' }, derivationVersion: 0 },
    ]);
  });

  it('keeps a session whose shape the migration does not recognise', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = recordOrThrow(migrate?.({ sessions: [{ id: 'a' }, 'garbage'] }, 1));
    expect(migrated.sessions).toEqual([
      { id: 'a', source: { kind: 'file' }, derivationVersion: 0 },
      'garbage',
    ]);
  });

  it('leaves an existing source alone during migration', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const source = { kind: 'demo' };
    const migrated = recordOrThrow(migrate?.({ sessions: [{ id: 'a', source }] }, 1));
    expect(recordOrThrow(listOrThrow(migrated.sessions)[0]).source).toEqual(source);
  });

  it('marks version 2 sessions for reprocessing and keeps a known derivation version', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const source = { kind: 'file' };
    const migrated = recordOrThrow(
      migrate?.(
        { sessions: [{ id: 'a', source }, { id: 'b', source, derivationVersion: 1 }, 'garbage'] },
        2,
      ),
    );
    expect(migrated.sessions).toEqual([
      { id: 'a', source, derivationVersion: 0 },
      { id: 'b', source, derivationVersion: 1 },
      'garbage',
    ]);
  });

  it('migrates version 3 state without an applied HR signature, so the first start re-scores HR loads', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const session = { id: 'a', source: { kind: 'file' }, derivationVersion: 4, tss: 55 };
    expect(migrate?.({ sessions: [session, 'garbage'] }, 3)).toEqual({
      sessions: [session, 'garbage'],
      appliedHrSignature: null,
    });
    expect(migrate?.('garbage', 3)).toBe('garbage');
  });

  it('the applied HR signature survives rehydrate', async () => {
    useSessionsStore.getState().setAppliedHrSignature('["male",[],[],[]]');
    await guardedSessionsStorage.flush();
    useSessionsStore.setState({ appliedHrSignature: null });

    await useSessionsStore.persist.rehydrate();

    expect(useSessionsStore.getState().appliedHrSignature).toBe('["male",[],[],[]]');
  });

  it('a tab holding outdated sessions does not overwrite the persisted sessions', async () => {
    const { createdAt: _ca, ...data } = createMockTrainingSession({ id: 'a', isNew: true });
    useSessionsStore.getState().addSessions({ sessions: [data], markNew: true });
    await guardedSessionsStorage.flush();

    const stale = { ...useSessionsStore.getState().sessions[0], derivationVersion: 0 };
    useSessionsStore.setState({ sessions: [stale] });
    useSessionsStore.getState().markSessionSeen('a');
    await guardedSessionsStorage.flush();

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
      const { createdAt: _ca, ...data } = createMockTrainingSession();
      useSessionsStore.getState().addSessions({ sessions: [data] });
      await guardedSessionsStorage.flush();

      expect(await db.get('kv', 'store-sessions')).toBe(before);
      expect(useSessionReprocessingStore.getState().newerVersionInOtherTab).toBe(true);
    } finally {
      await db.delete('kv', SESSIONS_DERIVATION_MARKER_KEY);
    }
  });

  it('persistence to IndexedDB', async () => {
    const { createdAt: _ca, ...data } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [data] });

    await new Promise((r) => setTimeout(r, 50));

    const db = await getDB();
    const stored = await db.get('kv', 'store-sessions');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.state.sessions).toHaveLength(1);
  });
});
