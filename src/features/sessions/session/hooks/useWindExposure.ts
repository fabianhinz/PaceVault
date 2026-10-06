import { useMemo } from 'react';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { computeWindExposure } from '@/packages/engine/windExposure.ts';
import type { WindExposure } from '@/packages/engine/windExposure.ts';
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
