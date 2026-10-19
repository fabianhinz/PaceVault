import { getSessionRecords, saveSessionGPS } from '@/lib/indexeddb.ts';
import { buildSessionGPS } from '@pacevault/engine/gps.ts';

export type WorkerMessageIn = { type: 'build'; sessionIds: string[] };

export type WorkerMessageOut = { type: 'done' };

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  for (const sid of e.data.sessionIds) {
    try {
      const records = await getSessionRecords(sid);
      const gpsData = buildSessionGPS(sid, records);
      if (gpsData) await saveSessionGPS(gpsData);
    } catch (err) {
      console.error(`GPS build failed for ${sid}:`, err);
    }
  }

  self.postMessage({ type: 'done' } satisfies WorkerMessageOut);
};
