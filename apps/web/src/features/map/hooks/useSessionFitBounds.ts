import { useEffect, useState } from 'react';
import { getSessionGPS } from '@/lib/indexeddb.ts';
import type { GPSBounds, SessionGPS } from '@pacevault/engine/types.ts';

interface StoredBounds {
  sessionId: string;
  bounds: GPSBounds;
}

export const useSessionFitBounds = (
  gpsData: SessionGPS[] | null,
  sessionId: string | null,
): GPSBounds | null => {
  const [stored, setStored] = useState<StoredBounds | null>(null);
  const listLoaded = gpsData !== null;

  useEffect(() => {
    if (listLoaded || sessionId === null) return;
    let cancelled = false;
    void getSessionGPS(sessionId).then((gps) => {
      if (cancelled || !gps) return;
      setStored({ sessionId, bounds: gps.bounds });
    });
    return () => {
      cancelled = true;
    };
  }, [listLoaded, sessionId]);

  if (sessionId === null) return null;
  if (gpsData !== null) {
    return gpsData.find((gps) => gps.sessionId === sessionId)?.bounds ?? null;
  }
  if (stored?.sessionId === sessionId) return stored.bounds;
  return null;
};
