import { useMemo } from 'react';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { relativeWindAngles } from '@/packages/engine/windExposure.ts';
import { toWindSamples, type SessionWeather } from '@/lib/weather.ts';
import { windRoseShares } from '@/lib/windRose.ts';

export const useWindRose = (
  records: SessionRecord[],
  weather: SessionWeather | null,
  sessionStartMs: number,
): number[] | null =>
  useMemo(() => {
    if (weather === null) return null;
    return windRoseShares(relativeWindAngles(records, toWindSamples(weather), sessionStartMs));
  }, [records, weather, sessionStartMs]);
