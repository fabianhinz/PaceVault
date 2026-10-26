import { useMemo } from 'react';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { useSessionRecords } from '@/queries/sessions/useSessionRecords.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useUserStore } from '@/store/user.ts';
import { windAngles } from '@pacevault/engine/windExposure.ts';
import { zoneScale } from '@/lib/zoneColors.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { speedScale } from '@/lib/speedScale.ts';
import { toWindSamples } from '@/lib/weather.ts';
import { useSessionWeather } from '@/queries/weather/useSessionWeather.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  buildWindColoredPath,
  type DetailPath,
} from '@/features/map/zoneColoredPath.ts';
import { sportTrackColor, trackModifiers } from '@/features/map/trackColors.ts';

export const useSessionDetailPath = ({
  hoveredSessionId,
  openedSessionId,
  sessions,
}: {
  hoveredSessionId: string | null;
  openedSessionId: string | null;
  sessions: TrainingSession[];
}): DetailPath | null => {
  const trackColorMode = useMapControlsStore((s) => s.trackColorMode);
  const profile = useUserStore((s) => s.profile);

  const targetId = openedSessionId ?? hoveredSessionId;
  const openedSession = sessions.find((s) => s.id === openedSessionId);
  const targetSession = sessions.find((s) => s.id === targetId);
  const targetRecords = useSessionRecords({
    sessionId: targetId ?? '',
    enabled: targetId !== null && targetSession?.hasDetailedRecords === true,
  });
  const weather = useSessionWeather({
    sessionId: openedSession?.id ?? '',
    sessionDateMs: openedSession?.date ?? 0,
    durationSec: openedSession?.duration ?? 0,
  }).data;

  return useMemo(() => {
    const records = targetRecords.data;
    if (!openedSessionId || records === undefined) return null;

    const session = sessions.find((s) => s.id === openedSessionId);
    if (!session) return null;

    if (trackColorMode === 'wind' && weather) {
      const angles = windAngles({
        records,
        wind: toWindSamples(weather),
        sessionStartMs: session.date,
      });
      return buildWindColoredPath({ records, angles });
    }

    if (trackColorMode === 'speed') {
      const scale = speedScale(records);
      if (scale) return buildZoneColoredPath({ records, metric: 'speed', scale });
    }

    const isZoneMode =
      trackColorMode === 'hr' || trackColorMode === 'power' || trackColorMode === 'pace';
    if (isZoneMode && profile) {
      const scale = zoneScale({
        metric: trackColorMode,
        thresholds: thresholdsAt({ profile, date: session.date }),
      });
      if (scale) return buildZoneColoredPath({ records, metric: trackColorMode, scale });
    }

    const [r, g, b] = sportTrackColor[session.sport];
    return buildSportColoredPath({
      records,
      sportColor: [r, g, b, trackModifiers.alpha.highlighted],
    });
  }, [targetRecords.data, openedSessionId, trackColorMode, profile, sessions, weather]);
};
