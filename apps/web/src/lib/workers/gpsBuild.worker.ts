import { getSessionRecords, saveSessionGPS } from '@/lib/storage/db.ts';
import { buildSessionGPS } from '@/lib/analysis/gpsTrack.ts';
import { workerMessageInSchema, type WorkerMessageOut } from './gpsBuildContract.ts';

self.onmessage = async (e: MessageEvent<unknown>) => {
  const message = workerMessageInSchema.safeParse(e.data);
  if (!message.success) return;
  for (const sid of message.data.sessionIds) {
    try {
      const records = await getSessionRecords(sid);
      const gpsData = buildSessionGPS({ sessionId: sid, records });
      if (gpsData) await saveSessionGPS(gpsData);
    } catch (err) {
      console.error(`GPS build failed for ${sid}:`, err);
    }
  }

  self.postMessage({ type: 'done' } satisfies WorkerMessageOut);
};
