import { useMemo } from 'react';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { useUserStore } from '@/store/user.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { colorModeOptions, effectiveColorMode, type WindInput } from '@/lib/colorModes.ts';
import { speedScale } from '@/lib/speedScale.ts';
import { toWindSamples } from '@/lib/weather.ts';
import { useSessionWeather } from './useSessionWeather.ts';

export const useSessionColorModes = (session: TrainingSession, records: SessionRecord[]) => {
  const thresholds = useUserStore((s) => s.profile?.thresholds);
  const chosen = useMapFocusStore((s) => s.sessionColorMode);
  const weather = useSessionWeather(session.id, session.date, session.duration);
  const isWeatherLoading = weather.isLoading;
  const weatherData = weather.data;

  const options = useMemo(() => {
    let wind: WindInput = { state: 'ready', samples: [] };
    if (isWeatherLoading) {
      wind = { state: 'loading' };
    } else if (weatherData) {
      wind = { state: 'ready', samples: toWindSamples(weatherData) };
    }
    return colorModeOptions({
      sport: session.sport,
      records,
      thresholds: thresholds ?? {},
      wind,
    });
  }, [session.sport, records, thresholds, isWeatherLoading, weatherData]);

  const speed = useMemo(() => {
    if (session.sport === 'running') return undefined;
    return speedScale(records);
  }, [session.sport, records]);

  return { options, speedScale: speed, effective: effectiveColorMode(chosen, options) };
};
