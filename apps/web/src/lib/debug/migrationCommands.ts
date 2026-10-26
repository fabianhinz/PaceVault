import { getDB } from '@/lib/storage/db.ts';
import { SESSIONS_DERIVATION_MARKER_KEY } from '@/lib/storage/guardedSessionsStorage.ts';
import {
  markSessionsOutdated,
  OUTDATED_VERSION,
  persistedSessionsSchema,
  SESSIONS_PERSIST_KEY,
} from './outdatedSessions.ts';

const rerunMigration = async ({ count }: { count?: number } = {}) => {
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
  const result = markSessionsOutdated(parsed.data, { count });
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
