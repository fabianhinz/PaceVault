import { useMemo } from 'react';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { computeWindExposure } from '@/packages/engine/windExposure.ts';
import type { WindExposure, WindSample } from '@/packages/engine/windExposure.ts';
import type { SessionWeather } from '@/lib/weather.ts';

/**
 * Adapt session records + cached weather into a head/cross/tail wind exposure.
 * Keeps the engine pure by mapping `SessionWeather` snapshots to plain `WindSample`s here.
 */
export const useWindExposure = (
  records: SessionRecord[],
  weather: SessionWeather | null,
  sessionStartMs: number,
): WindExposure | null => {
  return useMemo(() => {
    if (!weather) return null;
    const wind: WindSample[] = weather.snapshots.map((s) => ({
      time: s.time,
      direction: s.windDirection,
    }));
    return computeWindExposure(records, wind, sessionStartMs);
  }, [records, weather, sessionStartMs]);
};
