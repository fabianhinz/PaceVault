import { useState, useEffect } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { getAllSessionGPS } from '@/lib/indexeddb.ts';
import type { SessionGPS } from '@/packages/engine/types.ts';
import type { WorkerMessageIn } from '@/features/map/gpsBuild.worker.ts';
import { useSessionReprocessingActive } from '@/features/sessions/hooks/useSessionReprocessingActive.ts';

export const useGPSBackfill = () => {
  const [gpsData, setGpsData] = useState<SessionGPS[] | null>(null);

  const sessions = useSessionsStore((s) => s.sessions);
  const importing = useImportProgressStore((s) => s.runningImports > 0);
  const reprocessing = useSessionReprocessingActive();

  useEffect(() => {
    if (importing || reprocessing) return;

    let cancelled = false;
    let worker: Worker | null = null;

    const stopWorker = () => {
      worker?.terminate();
      worker = null;
    };

    const loadGps = async () => {
      const gps = await getAllSessionGPS();
      if (!cancelled) setGpsData(gps);
    };

    const run = async () => {
      const existingGPS = await getAllSessionGPS();
      if (cancelled) return;
      const processedIds = new Set(existingGPS.map((g) => g.sessionId));
      const missing = sessions.filter((s) => s.hasDetailedRecords && !processedIds.has(s.id));

      if (missing.length === 0) {
        setGpsData(existingGPS);
        return;
      }

      worker = new Worker(new URL('../gpsBuild.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = () => {
        stopWorker();
        void loadGps();
      };
      worker.onerror = stopWorker;
      worker.postMessage({
        type: 'build',
        sessionIds: missing.map((s) => s.id),
      } satisfies WorkerMessageIn);
    };

    void run();

    return () => {
      cancelled = true;
      stopWorker();
    };
  }, [sessions, importing, reprocessing]);

  return { gpsData };
};
