import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';
import { useRouteMatch } from '@/routing/useRouteMatch.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import {
  ADDITIVE_BLEND,
  HIGHLIGHT_TRANSITIONS,
  TRACK_COLOR_BY_SPORT,
  ALPHA_BY_TRACK_INTENSITY,
  trackModifiers,
} from '@/components/mapBackground/trackColors.ts';
import { decodeCached } from '@/components/mapBackground/trackPicking.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import type { DeckEventHandlers, MapTrack } from './types.ts';

interface TrackPickData {
  sessionId: string;
  track: MapTrack;
  path: [number, number][];
}

export const useTrackLayers = ({
  tracks,
  eventHandlers,
}: {
  tracks: MapTrack[];
  eventHandlers: DeckEventHandlers;
}): LayersList | null => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const studioActive = useStudioMapTracks().active;
  const trackIntensity = useMapPreferencesStore((s) => s.trackIntensity);
  const pointerFine = useDevice().pointerFine;
  const sessionMatch = useRouteMatch('sessionDetail');
  const highlightedSessionId = hoveredSessionId ?? sessionMatch?.id ?? null;

  const trackData = useMemo<TrackPickData[]>(
    () =>
      tracks.map((t) => ({
        sessionId: t.sessionId,
        track: t,
        path: decodeCached({ sessionId: t.sessionId, encoded: t.gps.encodedPolyline }),
      })),
    [tracks],
  );

  return useMemo(() => {
    if (openedSessionId || studioActive) {
      return null;
    }

    let transitions: typeof HIGHLIGHT_TRANSITIONS | undefined;
    if (pointerFine) transitions = HIGHLIGHT_TRANSITIONS;

    return [
      new PathLayer<TrackPickData>({
        id: 'gps-tracks',
        data: trackData,
        getPath: (d) => d.path,
        getColor: (d) => {
          const [r, g, b] = TRACK_COLOR_BY_SPORT[d.track.sport];
          let alpha = ALPHA_BY_TRACK_INTENSITY[trackIntensity];
          if (hoveredSessionId && hoveredSessionId !== d.sessionId) {
            alpha = 0;
          } else if (highlightedSessionId === d.sessionId) {
            alpha = trackModifiers.alpha.highlighted;
          }

          return [r, g, b, alpha];
        },
        getWidth: (d) => {
          if (d.sessionId === highlightedSessionId) return trackModifiers.width.highlighted;
          return trackModifiers.width.default;
        },
        widthMinPixels: 1,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getColor: [highlightedSessionId, hoveredSessionId, trackIntensity],
          getWidth: [highlightedSessionId],
        },
        transitions,
        parameters: ADDITIVE_BLEND,
        ...eventHandlers,
      }),
    ];
  }, [
    openedSessionId,
    studioActive,
    trackData,
    highlightedSessionId,
    hoveredSessionId,
    eventHandlers,
    trackIntensity,
    pointerFine,
  ]);
};
