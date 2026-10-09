import { z } from 'zod';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { isSessionOutdated } from '@/packages/engine/sessionDerivation.ts';
import { createGuardedSessionsStorage } from '@/lib/guardedSessionsStorage.ts';
import { useSessionReprocessingStore } from './sessionReprocessing.ts';

const persistedSessionsSchema = z.looseObject({ sessions: z.array(z.unknown()) });
const persistedSessionSchema = z.looseObject({ source: z.unknown().optional() });
const versionlessSessionSchema = z.looseObject({ derivationVersion: z.undefined().optional() });

const withFileSource = (session: unknown): unknown => {
  const parsed = persistedSessionSchema.safeParse(session);
  if (!parsed.success || parsed.data.source !== undefined) return session;
  return { ...parsed.data, source: { kind: 'file' } };
};

const withUnknownDerivationVersion = (session: unknown): unknown => {
  const parsed = versionlessSessionSchema.safeParse(session);
  if (!parsed.success) return session;
  return { ...parsed.data, derivationVersion: 0 };
};

const migrateSessionsState = (persisted: unknown, version: number): unknown => {
  const parsed = persistedSessionsSchema.safeParse(persisted);
  if (!parsed.success) return persisted;

  let sessions = parsed.data.sessions;
  if (version < 2) sessions = sessions.map(withFileSource);
  if (version < 3) sessions = sessions.map(withUnknownDerivationVersion);
  return { ...parsed.data, sessions };
};

interface SessionsState {
  sessions: TrainingSession[];
  addSessions: (
    sessions: Omit<TrainingSession, 'createdAt' | 'isNew'>[],
    options?: { markNew?: boolean },
  ) => void;
  deleteSession: (id: string) => void;
  commitReprocessedSession: (session: TrainingSession) => void;
  markSessionSeen: (id: string) => void;
  clearAll: () => void;
}

const canPersistSessions = (): boolean => {
  if (useSessionReprocessingStore.getState().phase === 'running') return true;
  return !useSessionsStore.getState().sessions.some(isSessionOutdated);
};

export const guardedSessionsStorage = createGuardedSessionsStorage({
  canWrite: canPersistSessions,
  onNewerVersion: () => useSessionReprocessingStore.getState().markNewerVersionInOtherTab(),
});

export const useSessionsStore = create<SessionsState>()(
  immer(
    persist(
      (set) => ({
        sessions: [],
        addSessions: (sessionsData, options) => {
          const newSessions = sessionsData.map((s) => ({
            ...s,
            createdAt: Date.now(),
            isNew: options?.markNew === true,
          }));
          set((draft) => {
            draft.sessions.push(...newSessions);
          });
        },
        deleteSession: (id) =>
          set((draft) => {
            draft.sessions = draft.sessions.filter((s) => s.id !== id);
          }),
        commitReprocessedSession: (session) =>
          set((draft) => {
            const index = draft.sessions.findIndex((s) => s.id === session.id);
            if (index === -1) return;
            draft.sessions[index] = session;
          }),
        markSessionSeen: (id) =>
          set((draft) => {
            const session = draft.sessions.find((s) => s.id === id);
            if (session) {
              session.isNew = false;
            }
          }),
        clearAll: () => set({ sessions: [] }),
      }),
      {
        name: 'store-sessions',
        storage: createJSONStorage(() => guardedSessionsStorage),
        skipHydration: true,
        version: 3,
        migrate: (persisted, version) => migrateSessionsState(persisted, version) as SessionsState,
      },
    ),
  ),
);
