import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';
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
import { sceneHoveredId, type MapSceneKind } from '@/components/mapBackground/mapScene.ts';
import { useMapScene } from './useMapScene.ts';
import type { DeckEventHandlers, MapTrack } from './types.ts';

const TRACKS_SHOWN_BY_SCENE_KIND: Record<MapSceneKind, boolean> = {
  overview: true,
  trip: true,
  session: false,
  segmentTab: true,
  segmentPage: false,
  studioTab: false,
  studioRoute: false,
};

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
  const scene = useMapScene();
  const shown = TRACKS_SHOWN_BY_SCENE_KIND[scene.kind];
  const hoveredSessionId = useMapFocusStore((s) =>
    sceneHoveredId({ hover: s.mapHover, sceneKey: scene.key, kind: 'session' }),
  );
  const segmentHovered = useMapFocusStore(
    (s) => sceneHoveredId({ hover: s.mapHover, sceneKey: scene.key, kind: 'segment' }) !== null,
  );
  const trackIntensity = useMapPreferencesStore((s) => s.trackIntensity);
  const pointerFine = useDevice().pointerFine;

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
    if (!shown) {
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
          if (segmentHovered || (hoveredSessionId !== null && hoveredSessionId !== d.sessionId)) {
            alpha = 0;
          } else if (hoveredSessionId === d.sessionId) {
            alpha = trackModifiers.alpha.highlighted;
          }

          return [r, g, b, alpha];
        },
        getWidth: (d) => {
          if (d.sessionId === hoveredSessionId) return trackModifiers.width.highlighted;
          return trackModifiers.width.default;
        },
        widthMinPixels: 1,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getColor: [hoveredSessionId, trackIntensity, segmentHovered],
          getWidth: [hoveredSessionId],
        },
        transitions,
        parameters: ADDITIVE_BLEND,
        ...eventHandlers,
      }),
    ];
  }, [
    shown,
    segmentHovered,
    trackData,
    hoveredSessionId,
    eventHandlers,
    trackIntensity,
    pointerFine,
  ]);
};
