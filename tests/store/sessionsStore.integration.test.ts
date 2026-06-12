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
