import { v4 } from 'uuid';
import { z } from 'zod';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SessionFields, TrainingSession } from '@/packages/engine/types.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

const persistedSessionsSchema = z.looseObject({ sessions: z.array(z.unknown()) });
const persistedSessionSchema = z.looseObject({ source: z.unknown().optional() });

const withFileSource = (session: unknown): unknown => {
  const parsed = persistedSessionSchema.safeParse(session);
  if (!parsed.success || parsed.data.source !== undefined) return session;
  return { ...parsed.data, source: { kind: 'file' } };
};

const migrateSessionsState = (persisted: unknown, version: number): unknown => {
  const parsed = persistedSessionsSchema.safeParse(persisted);
  if (!parsed.success) return persisted;

  let sessions = parsed.data.sessions;
  if (version < 2) sessions = sessions.map(withFileSource);
  return { ...parsed.data, sessions };
};

interface SessionsState {
  sessions: TrainingSession[];
  addSession: (session: Omit<TrainingSession, 'id' | 'createdAt' | 'isNew'>) => string;
  addSessions: (
    sessions: Omit<TrainingSession, 'id' | 'createdAt' | 'isNew'>[],
    options?: { markNew?: boolean },
  ) => string[];
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  replaceSessions: (updates: Array<{ id: string; session: SessionFields }>) => void;
  markSessionSeen: (id: string) => void;
  clearAll: () => void;
}

export const useSessionsStore = create<SessionsState>()(
  immer(
    persist(
      (set) => ({
        sessions: [],
        addSession: (sessionData) => {
          const id = v4();
          const session: TrainingSession = {
            ...sessionData,
            id,
            createdAt: Date.now(),
            isNew: true,
          };
          set((draft) => {
            draft.sessions.push(session);
          });
          return id;
        },
        addSessions: (sessionsData, options) => {
          const newSessions = sessionsData.map((s) => ({
            ...s,
            id: v4(),
            createdAt: Date.now(),
            isNew: options?.markNew !== false,
          }));
          set((draft) => {
            draft.sessions.push(...newSessions);
          });
          return newSessions.map((s) => s.id);
        },
        deleteSession: (id) =>
          set((draft) => {
            draft.sessions = draft.sessions.filter((s) => s.id !== id);
          }),
        renameSession: (id, name) =>
          set((draft) => {
            const session = draft.sessions.find((s) => s.id === id);
            if (session) {
              session.name = name;
            }
          }),
        replaceSessions: (updates) =>
          set((draft) => {
            const updateMap = new Map(updates.map((u) => [u.id, u.session]));
            draft.sessions.forEach((s, i) => {
              const updated = updateMap.get(s.id);
              if (!updated) return;
              draft.sessions[i] = {
                ...updated,
                id: s.id,
                createdAt: s.createdAt,
                isNew: s.isNew,
                source: s.source,
                name: s.name ?? updated.name,
              };
            });
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
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 2,
        migrate: (persisted, version) => migrateSessionsState(persisted, version) as SessionsState,
      },
    ),
  ),
);
