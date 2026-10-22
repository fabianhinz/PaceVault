import { useMemo } from 'react';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { computeWindExposure } from '@pacevault/engine/windExposure.ts';
import type { WindExposure } from '@pacevault/engine/windExposure.ts';
import { toWindSamples, type SessionWeather } from '@/lib/weather.ts';

export const useWindExposure = (
  records: SessionRecord[],
  weather: SessionWeather | null,
  sessionStartMs: number,
): WindExposure | null => {
  return useMemo(() => {
    if (!weather) return null;
    return computeWindExposure(records, toWindSamples(weather), sessionStartMs);
  }, [records, weather, sessionStartMs]);
};
