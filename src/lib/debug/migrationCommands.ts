import { z } from 'zod';
import { getDB } from '@/lib/db.ts';
import { SESSIONS_DERIVATION_MARKER_KEY } from '@/lib/guardedSessionsStorage.ts';
import { SESSION_DERIVATION_VERSION } from '@/packages/engine/sessionDerivation.ts';

const SESSIONS_PERSIST_KEY = 'store-sessions';
const OUTDATED_VERSION = SESSION_DERIVATION_VERSION - 1;

const persistedSessionsSchema = z.looseObject({
  state: z.looseObject({
    sessions: z.array(z.looseObject({ id: z.string(), date: z.number() })),
  }),
});

type PersistedSessions = z.infer<typeof persistedSessionsSchema>;

export const markSessionsOutdated = (
  persisted: PersistedSessions,
  count?: number,
): { persisted: PersistedSessions; marked: number } => {
  const newestFirst = persisted.state.sessions.toSorted((a, b) => b.date - a.date);
  let selected = newestFirst;
  if (count !== undefined) selected = newestFirst.slice(0, Math.max(0, count));
  const markedIds = new Set(selected.map((session) => session.id));
  const sessions = persisted.state.sessions.map((session) => {
    if (!markedIds.has(session.id)) return session;
    return { ...session, derivationVersion: OUTDATED_VERSION };
  });
  return {
    persisted: { ...persisted, state: { ...persisted.state, sessions } },
    marked: markedIds.size,
  };
};

const rerunMigration = async (options?: { count?: number }) => {
  const db = await getDB();
  const tx = db.transaction('kv', 'readwrite');
  const parsed = persistedSessionsSchema.safeParse(
    JSON.parse((await tx.store.get(SESSIONS_PERSIST_KEY)) ?? 'null'),
  );
  if (!parsed.success) {
    await tx.done;
    console.warn('pvDebug: no persisted sessions found, nothing to migrate');
    return;
  }
  const result = markSessionsOutdated(parsed.data, options?.count);
  await tx.store.put(JSON.stringify(result.persisted), SESSIONS_PERSIST_KEY);
  await tx.store.put(String(OUTDATED_VERSION), SESSIONS_DERIVATION_MARKER_KEY);
  await tx.done;
  console.info(
    `pvDebug: marked ${result.marked} sessions as derivation v${OUTDATED_VERSION}, reloading. Open DevTools > Performance monitor to watch memory.`,
  );
  window.location.reload();
};

export const migrationCommands = {
  rerunMigration,
};

export const migrationCommandDocs: Record<keyof typeof migrationCommands, string> = {
  rerunMigration: 'Mark sessions outdated + reload — real reprocess ({ count } = newest N only)',
};
