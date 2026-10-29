import { useMemo } from 'react';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { useThresholdsAt } from '@/components/settings/hooks/useThresholdsAt.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import {
  colorModeOptions,
  effectiveColorMode,
  type ColorMode,
  type ColorModeOption,
  type WindInput,
} from '@/lib/colors/colorModes.ts';
import { speedScale, type SpeedScale } from '@/lib/colors/speedScale.ts';
import { toWindSamples } from '@/lib/api/weather.ts';
import { useSessionWeather } from '@/queries/weather/useSessionWeather.ts';

interface SessionColorModes {
  options: ColorModeOption[];
  speedScale: SpeedScale | undefined;
  effective: ColorMode;
}

export const useSessionColorModes = ({
  session,
  records,
}: {
  session: TrainingSession;
  records: SessionRecord[];
}): SessionColorModes => {
  const thresholds = useThresholdsAt(session.date);
  const chosen = useMapPreferencesStore((s) => s.bySport[session.sport].colorMode);
  const weather = useSessionWeather({
    sessionId: session.id,
    sessionDateMs: session.date,
    durationSec: session.duration,
  });
  const weatherLoading = weather.isLoading;
  const weatherData = weather.data;

  const options = useMemo(() => {
    let wind: WindInput = { state: 'ready', samples: [] };
    if (weatherLoading) {
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
  }, [session.sport, records, thresholds, weatherLoading, weatherData]);

  const speed = useMemo(() => {
    if (session.sport === 'running') return undefined;
    return speedScale(records);
  }, [session.sport, records]);

  return { options, speedScale: speed, effective: effectiveColorMode(chosen, options) };
};
