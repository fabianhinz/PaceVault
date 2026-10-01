import { getSessionRecords } from '@/lib/indexeddb.ts';
import { computePBsForSessions } from '@/lib/records.ts';
import type { PersonalBest, Sport } from '@/packages/engine/types.ts';

export interface PBSessionMeta {
  sessionId: string;
  date: number;
  sport: Sport;
  distance?: number;
  elevationGain?: number;
}

export type WorkerMessageIn = { type: 'compute'; sessions: PBSessionMeta[] };

export type WorkerMessageOut = { type: 'done'; pbs: PersonalBest[] };

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  let pbs: PersonalBest[] = [];
  for (const session of e.data.sessions) {
    const records = await getSessionRecords(session.sessionId).catch(() => []);
    pbs = computePBsForSessions([{ ...session, records }], pbs);
  }

  self.postMessage({ type: 'done', pbs } satisfies WorkerMessageOut);
};
