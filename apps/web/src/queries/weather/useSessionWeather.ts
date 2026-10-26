import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getSessionRecords, getSessionWeather, saveSessionWeather } from '@/lib/db.ts';
import { fetchSessionWeather } from '@/lib/weather.ts';
import type { QueryResults } from '@/types.ts';

export const loadSessionWeather = async (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): Promise<QueryResults['sessionWeather']> => {
  const cached = await getSessionWeather(options.sessionId);
  if (cached) return cached;

  const records = await getSessionRecords(options.sessionId);
  const gpsRecorded = records.some((r) => r.lat !== undefined && r.lng !== undefined);
  if (!gpsRecorded) return null;

  if (!navigator.onLine) return null;

  const weather = await fetchSessionWeather({
    sessionId: options.sessionId,
    sessionDateMs: options.sessionDateMs,
    durationSec: options.durationSec,
    records,
  });
  if (!weather) return null;

  await saveSessionWeather(weather);
  return weather;
};

export const sessionWeatherQueryKey = (options: { sessionId: string }): string[] => [
  'session-weather',
  options.sessionId,
];

export const useSessionWeather = (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}): UseQueryResult<QueryResults['sessionWeather']> =>
  useQuery({
    queryKey: sessionWeatherQueryKey({ sessionId: options.sessionId }),
    queryFn: () => loadSessionWeather(options),
    enabled: options.sessionId !== '' && options.durationSec > 0,
    staleTime: Infinity,
    retry: false,
  });
