import { useMemo } from 'react';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { relativeWindAngles } from '@pacevault/engine/windExposure.ts';
import { toWindSamples } from '@/lib/api/weather.ts';
import type { SessionWeather } from '@/types.ts';
import { windRoseShares } from '@/components/sessions/session/windRoseSectors.ts';

export const useWindRose = ({
  records,
  weather,
  sessionStartMs,
}: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}): number[] | null =>
  useMemo(() => {
    if (weather === null) return null;
    return windRoseShares(
      relativeWindAngles({ records, wind: toWindSamples(weather), sessionStartMs }),
    );
  }, [records, weather, sessionStartMs]);
