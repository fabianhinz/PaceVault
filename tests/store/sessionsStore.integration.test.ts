import { describe, it, expect } from 'vitest';
import { useSessionsStore } from '@/store/sessions.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { getDB } from '@/lib/db';

describe('sessions store', () => {
  it('addSession returns UUID, session in state', () => {
    const { id: _id, createdAt: _ca, ...sessionData } = makeSession();
    const id = useSessionsStore.getState().addSession(sessionData);

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].sport).toBe('cycling');
  });

  it('deleteSession removes it', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().deleteSession(id);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('addSessions batch-adds multiple sessions and returns IDs', () => {
    const batch = [
      makeSession(),
      makeSession({ sport: 'running' }),
      makeSession({ sport: 'cycling' }),
    ];
    const inputs = batch.map(({ id: _id, createdAt: _ca, ...data }) => data);

    const ids = useSessionsStore.getState().addSessions(inputs);

    expect(ids).toHaveLength(3);
    ids.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
    });

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions).toHaveLength(3);
    expect(sessions[0].sport).toBe('cycling');
    expect(sessions[1].sport).toBe('running');
    expect(sessions[2].sport).toBe('cycling');

    // IDs returned match stored sessions
    ids.forEach((id, i) => {
      expect(sessions[i].id).toBe(id);
    });
  });

  it('addSessions with empty array is a no-op', () => {
    const ids = useSessionsStore.getState().addSessions([]);
    expect(ids).toHaveLength(0);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('renameSession updates the session name', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);

    useSessionsStore.getState().renameSession(id, 'Morning Ride');

    const session = useSessionsStore.getState().sessions.find((s) => s.id === id);
    expect(session?.name).toBe('Morning Ride');
  });

  it('renameSession with unknown id is a no-op', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);
    const before = useSessionsStore.getState().sessions;

    useSessionsStore.getState().renameSession('nonexistent', 'Nope');

    const after = useSessionsStore.getState().sessions;
    expect(after).toEqual(before);
  });

  it('clearAll resets', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);

    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().clearAll();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('stamps isNew on add and clears it via markSessionSeen', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);

    expect(useSessionsStore.getState().sessions[0].isNew).toBe(true);

    useSessionsStore.getState().markSessionSeen(id);
    expect(useSessionsStore.getState().sessions[0].isNew).toBe(false);
  });

  it('stamps isNew on every session added as a batch', () => {
    const inputs = [makeSession(), makeSession({ sport: 'running' })].map(
      ({ id: _id, createdAt: _ca, ...data }) => data,
    );

    useSessionsStore.getState().addSessions(inputs);

    expect(useSessionsStore.getState().sessions.map((s) => s.isNew)).toEqual([true, true]);
  });

  it('markSessionSeen ignores an unknown id', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);

    useSessionsStore.getState().markSessionSeen('does-not-exist');
    expect(useSessionsStore.getState().sessions[0].isNew).toBe(true);
  });

  it('replaceSessions preserves a cleared isNew so reimport does not re-badge', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);
    useSessionsStore.getState().markSessionSeen(id);

    const { id: _id2, createdAt: _ca2, ...updated } = makeSession({ sport: 'running' });
    useSessionsStore.getState().replaceSessions([{ id, session: updated }]);

    const session = useSessionsStore.getState().sessions[0];
    expect(session.sport).toBe('running');
    expect(session.isNew).toBe(false);
  });

  it('replaceSessions keeps a name the re-parsed file cannot recreate', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession({ name: 'Evening Radfahren' });
    const id = useSessionsStore.getState().addSession(data);

    const { id: _id2, createdAt: _ca2, ...updated } = makeSession({ name: undefined });
    useSessionsStore.getState().replaceSessions([{ id, session: updated }]);

    expect(useSessionsStore.getState().sessions[0].name).toBe('Evening Radfahren');
  });

  it('replaceSessions takes the re-parsed name when the session had none', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession({ name: undefined });
    const id = useSessionsStore.getState().addSession(data);

    const { id: _id2, createdAt: _ca2, ...updated } = makeSession({ name: 'Lauf am Morgen' });
    useSessionsStore.getState().replaceSessions([{ id, session: updated }]);

    expect(useSessionsStore.getState().sessions[0].name).toBe('Lauf am Morgen');
  });

  it('replaceSessions drops fields the re-parsed file no longer produces', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession({ avgPower: 210, deviceTss: 80 });
    const id = useSessionsStore.getState().addSession(data);

    const {
      id: _id2,
      createdAt: _ca2,
      ...updated
    } = makeSession({
      avgPower: undefined,
      deviceTss: undefined,
    });
    useSessionsStore.getState().replaceSessions([{ id, session: updated }]);

    const session = useSessionsStore.getState().sessions[0];
    expect(session.avgPower).toBeUndefined();
    expect(session.deviceTss).toBeUndefined();
    expect(session.id).toBe(id);
  });

  it('replaceSessions keeps the source the re-parsed file cannot know', () => {
    const {
      id: _id,
      createdAt: _ca,
      ...data
    } = makeSession({
      source: { kind: 'intervals', activityId: 'i42' },
    });
    const id = useSessionsStore.getState().addSession(data);

    const {
      id: _id2,
      createdAt: _ca2,
      source: _source,
      ...updated
    } = makeSession({ sport: 'running' });
    useSessionsStore.getState().replaceSessions([{ id, session: updated }]);

    expect(useSessionsStore.getState().sessions[0].source).toEqual({
      kind: 'intervals',
      activityId: 'i42',
    });
  });

  it('migrates version 1 sessions to file imports', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = migrate?.({ sessions: [{ id: 'a' }, { id: 'b' }] }, 1) as {
      sessions: Array<{ id: string; source: unknown }>;
    };
    expect(migrated.sessions).toEqual([
      { id: 'a', source: { kind: 'file' } },
      { id: 'b', source: { kind: 'file' } },
    ]);
  });

  it('keeps a session whose shape the migration does not recognise', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const migrated = migrate?.({ sessions: [{ id: 'a' }, 'garbage'] }, 1) as {
      sessions: unknown[];
    };
    expect(migrated.sessions).toEqual([{ id: 'a', source: { kind: 'file' } }, 'garbage']);
  });

  it('leaves an existing source alone during migration', () => {
    const migrate = useSessionsStore.persist.getOptions().migrate;
    const source = { kind: 'demo' };
    const migrated = migrate?.({ sessions: [{ id: 'a', source }] }, 1) as {
      sessions: Array<{ source: unknown }>;
    };
    expect(migrated.sessions[0]?.source).toEqual(source);
  });

  it('persistence to IndexedDB', async () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);

    // Allow async IDB write to complete
    await new Promise((r) => setTimeout(r, 50));

    const db = await getDB();
    const stored = await db.get('kv', 'store-sessions');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.state.sessions).toHaveLength(1);
  });
});
