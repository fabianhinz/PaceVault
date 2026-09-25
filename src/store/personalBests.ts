import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { computePBsForSessions, type PBSessionInput } from '@/lib/records.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { PersonalBest } from '@/packages/engine/types.ts';

interface PersonalBestsState {
  pbs: PersonalBest[];
  addSessionPBs: (sessions: PBSessionInput[]) => void;
  recomputeAllPBs: () => Promise<void>;
  removeSessionPBs: (sessionId: string) => Promise<void>;
  clearPBs: () => void;
}

let latestRecompute = 0;
let addedDuringRecompute: PBSessionInput[] | null = null;

export const usePersonalBestsStore = create<PersonalBestsState>()(
  immer(
    persist(
      (set, get) => ({
        pbs: [],
        addSessionPBs: (sessions) => {
          addedDuringRecompute?.push(...sessions);
          set({ pbs: computePBsForSessions(sessions, get().pbs) });
        },
        recomputeAllPBs: async () => {
          latestRecompute++;
          const run = latestRecompute;
          addedDuringRecompute = [];

          const sessions = useSessionsStore
            .getState()
            .sessions.filter((s) => !s.isPlanned && s.hasDetailedRecords);

          let pbs: PersonalBest[] = [];
          for (const session of sessions) {
            const records = await getSessionRecords(session.id).catch(() => []);
            if (run !== latestRecompute) return;
            pbs = computePBsForSessions(
              [
                {
                  sessionId: session.id,
                  date: session.date,
                  sport: session.sport,
                  records,
                  distance: session.distance,
                  elevationGain: session.elevationGain,
                },
              ],
              pbs,
            );
          }

          pbs = computePBsForSessions(addedDuringRecompute ?? [], pbs);
          addedDuringRecompute = null;
          set({ pbs });
        },
        removeSessionPBs: async (sessionId) => {
          if (!get().pbs.some((pb) => pb.sessionId === sessionId)) return;
          await get().recomputeAllPBs();
        },
        clearPBs: () => {
          latestRecompute++;
          addedDuringRecompute = null;
          set({ pbs: [] });
        },
      }),
      {
        name: 'store-personal-bests',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
        partialize: (state) => ({ pbs: state.pbs }),
      },
    ),
  ),
);
