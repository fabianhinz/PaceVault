import { getSessionRecords } from '@/lib/db.ts';
import { computePBsForSessions } from '@/lib/records.ts';
import type { PersonalBest } from '@pacevault/engine/types.ts';
import type { WorkerMessageIn, WorkerMessageOut } from './personalBestsContract.ts';

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  let pbs: PersonalBest[] = [];
  for (const session of e.data.sessions) {
    const records = await getSessionRecords(session.sessionId).catch(() => []);
    pbs = computePBsForSessions({ sessions: [{ ...session, records }], existing: pbs });
  }

  self.postMessage({ type: 'done', pbs } satisfies WorkerMessageOut);
};
