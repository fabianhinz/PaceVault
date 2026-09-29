import { useState, useEffect } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { useIntervalsProgressStore } from '@/features/intervals/syncProgress.ts';
import { getAllSessionGPS } from '@/lib/indexeddb.ts';
import type { SessionGPS } from '@/packages/engine/types.ts';
import type { WorkerMessageOut } from '@/features/map/gpsBuild.worker.ts';

export const useGPSBackfill = () => {
  const [backfilling, setBackfilling] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [gpsData, setGpsData] = useState<SessionGPS[] | null>(null);

  const sessions = useSessionsStore((s) => s.sessions);
  const uploading = useUploadProgressStore((s) => s.uploading);
  const syncing = useIntervalsProgressStore((s) => s.total > 0);

  useEffect(() => {
    if (uploading || syncing) return;

    let worker: Worker | null = null;

    const run = async () => {
      const existingGPS = await getAllSessionGPS();
      const processedIds = new Set(existingGPS.map((g) => g.sessionId));

      const missing = sessions.filter((s) => s.hasDetailedRecords && !processedIds.has(s.id));

      if (missing.length === 0) {
        setGpsData(existingGPS);
        return;
      }

      setBackfilling(true);
      setProcessed(0);
      setTotal(missing.length);

      worker = new Worker(new URL('../gpsBuild.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
        if (e.data.type === 'progress') {
          setProcessed(e.data.processed);
        } else if (e.data.type === 'done') {
          setBackfilling(false);
          worker?.terminate();
          worker = null;
          getAllSessionGPS().then(setGpsData);
        }
      };

      worker.onerror = () => {
        setBackfilling(false);
        worker?.terminate();
        worker = null;
      };

      worker.postMessage({ type: 'build', sessionIds: missing.map((s) => s.id) });
    };

    run();

    return () => {
      worker?.terminate();
      worker = null;
    };
  }, [sessions, uploading, syncing]);

  return { gpsData, backfilling, processed, total };
};
