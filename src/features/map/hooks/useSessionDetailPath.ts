import { useState, useEffect, useMemo, useRef } from 'react';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useUserStore } from '@/store/user.ts';
import { classifyWindSegments } from '@/packages/engine/windExposure.ts';
import { zoneScale } from '@/lib/zoneColors.ts';
import { toWindSamples } from '@/lib/weather.ts';
import { useSessionWeather } from '@/features/sessions/session/hooks/useSessionWeather.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  buildWindColoredPath,
  type DetailPath,
} from '../zoneColoredPath.ts';
import { sportTrackColor, trackModifiers } from '../trackColors.ts';

export const useSessionDetailPath = (
  hoveredSessionId: string | null,
  openedSessionId: string | null,
  sessions: TrainingSession[],
): DetailPath | null => {
  const trackColorMode = useMapFocusStore((s) => s.trackColorMode);
  const profile = useUserStore((s) => s.profile);

  const [loaded, setLoaded] = useState<{ id: string; records: SessionRecord[] } | null>(null);
  const fetchedIdRef = useRef<string | null>(null);

  const targetId = openedSessionId ?? hoveredSessionId;
  const openedSession = sessions.find((s) => s.id === openedSessionId);
  const weather = useSessionWeather(
    openedSession?.id ?? '',
    openedSession?.date ?? 0,
    openedSession?.duration ?? 0,
  ).data;

  useEffect(() => {
    if (!targetId) return;
    if (fetchedIdRef.current === targetId) return;

    const session = sessions.find((s) => s.id === targetId);
    if (!session?.hasDetailedRecords) return;

    fetchedIdRef.current = targetId;
    let cancelled = false;
    getSessionRecords(targetId).then((records) => {
      if (!cancelled) {
        setLoaded({ id: targetId, records });
      }
    });

    return () => {
      cancelled = true;
      fetchedIdRef.current = null;
    };
  }, [targetId, sessions]);

  return useMemo(() => {
    if (!openedSessionId || loaded?.id !== openedSessionId) return null;

    const session = sessions.find((s) => s.id === openedSessionId);
    if (!session) return null;

    if (trackColorMode === 'wind' && weather) {
      const classes = classifyWindSegments(loaded.records, toWindSamples(weather), session.date);
      return buildWindColoredPath(loaded.records, classes);
    }

    const isZoneMode =
      trackColorMode === 'hr' || trackColorMode === 'power' || trackColorMode === 'pace';
    if (isZoneMode && profile) {
      const scale = zoneScale(trackColorMode, profile.thresholds);
      if (scale) return buildZoneColoredPath(loaded.records, trackColorMode, scale);
    }

    const [r, g, b] = sportTrackColor[session.sport];
    return buildSportColoredPath(loaded.records, [r, g, b, trackModifiers.alpha.highlighted]);
  }, [loaded, openedSessionId, trackColorMode, profile, sessions, weather]);
};
