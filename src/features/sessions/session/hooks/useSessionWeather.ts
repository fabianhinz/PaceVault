import { useQuery } from '@tanstack/react-query';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { getSessionWeather, saveSessionWeather } from '@/lib/weatherDb.ts';
import { fetchSessionWeather } from '@/lib/weather.ts';
import type { SessionWeather } from '@/lib/weather.ts';

const loadWeather = async (
  sessionId: string,
  sessionDateMs: number,
  durationSec: number,
): Promise<SessionWeather | null> => {
  // 1. Check IndexedDB cache
  const cached = await getSessionWeather(sessionId);
  if (cached) return cached;

  // 2. Load records for GPS waypoints
  const records = await getSessionRecords(sessionId);
  const hasGps = records.some((r) => r.lat !== undefined && r.lng !== undefined);
  if (!hasGps) return null;

  // 3. Check connectivity
  if (!navigator.onLine) return null;

  // 4. Fetch from Open-Meteo
  const weather = await fetchSessionWeather(sessionId, sessionDateMs, durationSec, records);
  if (!weather) return null;

  // 5. Persist to IndexedDB
  await saveSessionWeather(weather);
  return weather;
};

export const useSessionWeather = (
  sessionId: string,
  sessionDateMs: number,
  durationSec: number,
) => {
  return useQuery({
    queryKey: ['session-weather', sessionId],
    queryFn: () => loadWeather(sessionId, sessionDateMs, durationSec),
    enabled: sessionId !== '' && durationSec > 0,
    staleTime: Infinity,
    retry: false,
  });
};
