import { useMemo } from 'react';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionColoringStore } from '@/store/sessionColoring.ts';
import { colorModeStatuses, effectiveColorMode, type WindInput } from '@/lib/colorModes.ts';
import { toWindSamples } from '@/lib/weather.ts';
import { useSessionWeather } from './useSessionWeather.ts';

export const useSessionColorModes = (session: TrainingSession, records: SessionRecord[]) => {
  const thresholds = useUserStore((s) => s.profile?.thresholds);
  const stored = useSessionColoringStore((s) => s.colorMode);
  const weather = useSessionWeather(session.id, session.date, session.duration);
  const isWeatherLoading = weather.isLoading;
  const weatherData = weather.data;

  const statuses = useMemo(() => {
    let wind: WindInput = { state: 'ready', samples: [] };
    if (isWeatherLoading) {
      wind = { state: 'loading' };
    } else if (weatherData) {
      wind = { state: 'ready', samples: toWindSamples(weatherData) };
    }
    return colorModeStatuses({
      sport: session.sport,
      records,
      thresholds: thresholds ?? {},
      wind,
    });
  }, [session.sport, records, thresholds, isWeatherLoading, weatherData]);

  return { statuses, effective: effectiveColorMode(stored, statuses) };
};
