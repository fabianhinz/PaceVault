import { z } from 'zod';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';

export const SESSIONS_PERSIST_KEY = 'store-sessions';
export const OUTDATED_VERSION = SESSION_DERIVATION_VERSION - 1;

export const persistedSessionsSchema = z.looseObject({
  state: z.looseObject({
    sessions: z.array(z.looseObject({ id: z.string(), date: z.number() })),
  }),
});

type PersistedSessions = z.infer<typeof persistedSessionsSchema>;

export const markSessionsOutdated = (
  persisted: PersistedSessions,
  { count }: { count?: number } = {},
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
