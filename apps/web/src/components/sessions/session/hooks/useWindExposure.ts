import { useMemo } from 'react';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { windExposureFromRecords } from '@pacevault/engine/windExposure.ts';
import type { WindExposure } from '@pacevault/engine/windExposure.ts';
import { toWindSamples } from '@/lib/api/weather.ts';
import type { SessionWeather } from '@/types.ts';

export const useWindExposure = ({
  records,
  weather,
  sessionStartMs,
}: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}): WindExposure | null => {
  return useMemo(() => {
    if (!weather) return null;
    return windExposureFromRecords({ records, wind: toWindSamples(weather), sessionStartMs });
  }, [records, weather, sessionStartMs]);
};
