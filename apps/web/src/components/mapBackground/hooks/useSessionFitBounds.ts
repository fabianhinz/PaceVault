import type { GPSBounds, SessionGPS } from '@pacevault/engine/types.ts';
import { useSessionGps } from '@/queries/sessions/useSessionGps.ts';

export const useSessionFitBounds = ({
  gpsData,
  sessionId,
}: {
  gpsData: SessionGPS[] | null;
  sessionId: string | null;
}): GPSBounds | null => {
  const sessionGps = useSessionGps({
    sessionId: sessionId ?? '',
    enabled: gpsData === null && sessionId !== null,
  });

  if (sessionId === null) return null;
  if (gpsData !== null) {
    return gpsData.find((gps) => gps.sessionId === sessionId)?.bounds ?? null;
  }
  return sessionGps.data?.bounds ?? null;
};
