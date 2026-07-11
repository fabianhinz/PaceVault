import { useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useSessionDetailPath } from './hooks/useSessionDetailPath.ts';
import type { DetailPath } from './zoneColoredPath.ts';
import {
  ADDITIVE_BLEND,
  sportMarkerColor,
  sportTrackColor,
  trackModifiers,
} from './trackColors.ts';
import type { LapMarker } from '@/lib/lapMarkers.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useDeckMetricsStore } from '@/store/deckMetrics.ts';
import type { MapTrack } from './hooks/useMapTracks.ts';
import { decodeCached, PICK_RADIUS, type TrackPickData } from './hooks/types.ts';
import { useStudioMapTracks, type StudioMapRoute } from './hooks/useStudioMapTracks.ts';
import { useControl } from 'react-map-gl/maplibre';

type PickHandler = (info: PickingInfo, event: unknown) => boolean | void;

interface DeckGLOverlayProps {
  tracks: MapTrack[];
  onClick?: PickHandler;
  onHover?: PickHandler;
}

export const DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const hoveredPoint = useMapFocusStore((s) => s.hoveredPoint);
  const pickCircle = useMapFocusStore((s) => s.pickCircle);
  const lapMarkers = useMapFocusStore((s) => s.lapMarkers);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);
  const hoveredLapIndex = useMapFocusStore((s) => s.hoveredLapIndex);
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const hoveredStudioRouteId = useMapFocusStore((s) => s.hoveredStudioRouteId);
  const studioTracks = useStudioMapTracks();
  const sessions = useSessionsStore((s) => s.sessions);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  const detailPath = useSessionDetailPath(hoveredSessionId, openedSessionId, sessions);

  const match = useMatch('/sessions/:id');
  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  // The studio is about future routes — session tracks are hidden while the
  // studio tab or a route detail page is open.
  const studioActive = studioTracks.active;

  const eventHandlers = useMemo(
    (): { onClick?: PickHandler; onHover?: PickHandler } =>
      onboardingComplete ? { onClick: props.onClick, onHover: props.onHover } : {},
    [onboardingComplete, props.onClick, props.onHover],
  );

  const trackLayers = useMemo(() => {
    if (openedSessionId || studioActive) {
      return null;
    }

    const data: TrackPickData[] = props.tracks.map((t) => ({
      sessionId: t.sessionId,
      track: t,
      path: decodeCached(t.sessionId, t.gps.encodedPolyline),
    }));

    return [
      new PathLayer<TrackPickData>({
        id: 'gps-tracks',
        data,
        getPath: (d) => d.path,
        getColor: (d) => {
          const [r, g, b, a] = sportTrackColor[d.track.sport];
          let alpha = a;
          if (hoveredSessionId && hoveredSessionId !== d.sessionId) {
            alpha = 0;
          } else if (highlightedSessionId === d.sessionId) {
            alpha = trackModifiers.alpha.highlighted;
          }

          return [r, g, b, alpha];
        },
        getWidth: (d) =>
          d.sessionId === highlightedSessionId
            ? trackModifiers.width.highlighted
            : trackModifiers.width.default,
        widthMinPixels: 1,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getColor: [highlightedSessionId, hoveredSessionId],
          getWidth: [highlightedSessionId],
        },
        transitions: {
          getWidth: 300,
          getColor: 300,
        },
        parameters: ADDITIVE_BLEND,
        ...eventHandlers,
      }),
    ];
  }, [
    openedSessionId,
    studioActive,
    props.tracks,
    highlightedSessionId,
    hoveredSessionId,
    eventHandlers,
  ]);

  const detailLayer = useMemo(() => {
    if (!detailPath) {
      return null;
    }

    return new PathLayer<DetailPath>({
      id: 'session-detail',
      data: [detailPath],
      getPath: (d) => d.path,
      getColor: (d) => d.color,
      getWidth: trackModifiers.width.highlighted,
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: true,
      updateTriggers: { getColor: [zoneColorMode, openedSessionId] },
      ...eventHandlers,
    });
  }, [detailPath, zoneColorMode, openedSessionId, eventHandlers]);

  const studioRouteLayer = useMemo(() => {
    if (studioTracks.routes.length === 0) {
      return null;
    }

    const versionKey = studioTracks.routes.map((r) => `${r.id}:${r.color.join(',')}`).join('|');

    return new PathLayer<StudioMapRoute>({
      id: 'studio-routes',
      data: studioTracks.routes,
      getPath: (d) => decodeCached(`studio-${d.id}`, d.encodedPolyline),
      getColor: (d) => {
        let alpha = trackModifiers.alpha.highlighted;
        if (hoveredStudioRouteId && hoveredStudioRouteId !== d.id) {
          alpha = 0;
        }
        return [d.color[0], d.color[1], d.color[2], alpha];
      },
      // Detail (single focused route) and the hovered route draw wider than
      // the tab's all-routes overview.
      getWidth: (d) => {
        if (d.id === studioTracks.focusedRouteId || d.id === hoveredStudioRouteId) {
          return trackModifiers.width.highlighted;
        }
        return trackModifiers.width.default;
      },
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: false,
      updateTriggers: {
        getPath: [versionKey],
        getColor: [versionKey, hoveredStudioRouteId],
        getWidth: [studioTracks.focusedRouteId, hoveredStudioRouteId],
      },
      transitions: {
        getWidth: 300,
        getColor: 300,
      },
    });
  }, [studioTracks.routes, studioTracks.focusedRouteId, hoveredStudioRouteId]);

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) {
      return null;
    }

    return new ScatterplotLayer<{ center: [number, number] }>({
      id: 'pick-circle',
      data: [{ center: pickCircle }],
      getPosition: (d) => d.center,
      getRadius: PICK_RADIUS,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, 13],
      filled: true,
      stroked: true,
      getLineColor: [255, 255, 255, 25],
      lineWidthUnits: 'pixels' as const,
      getLineWidth: 1,
      pickable: false,
    });
  }, [pickCircle]);

  const hoveredPointLayer = useMemo(() => {
    if (!hoveredPoint) {
      return null;
    }

    return new ScatterplotLayer<{ position: [number, number] }>({
      id: 'hovered-point',
      data: [{ position: hoveredPoint }],
      getPosition: (d) => d.position,
      getRadius: 12,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, trackModifiers.alpha.highlighted],
      filled: true,
      stroked: true,
      getLineColor: [0, 0, 0, trackModifiers.alpha.default],
      lineWidthUnits: 'pixels' as const,
      getLineWidth: 4,
      pickable: false,
    });
  }, [hoveredPoint]);

  const lapMarkerLayers = useMemo(() => {
    if (lapMarkers.length === 0 || !focusedSport) {
      return null;
    }

    const fill = sportMarkerColor[focusedSport];
    const [r, g, b] = sportTrackColor[focusedSport];

    return lapMarkers.flatMap((marker) => {
      let lineAlpha = 0;
      if (hoveredLapIndex != null && marker.lapIndex === hoveredLapIndex) {
        lineAlpha = 255;
      }
      return [
        new ScatterplotLayer<LapMarker>({
          id: `lap-marker-circle-${marker.lapIndex}`,
          data: [marker],
          getPosition: (d) => d.position,
          getRadius: 12,
          radiusUnits: 'pixels',
          getFillColor: fill,
          filled: true,
          stroked: true,
          getLineColor: [r, g, b, lineAlpha],
          lineWidthUnits: 'pixels' as const,
          getLineWidth: 4,
          pickable: false,
          updateTriggers: {
            getLineColor: [hoveredLapIndex],
          },
        }),
        new TextLayer<LapMarker>({
          id: `lap-marker-label-${marker.lapIndex}`,
          data: [marker],
          getPosition: (d) => d.position,
          getText: (d) => d.label,
          getSize: 12,
          getColor: [0, 0, 0, 255],
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
          pickable: false,
        }),
      ];
    });
  }, [lapMarkers, focusedSport, hoveredLapIndex]);

  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ pickingRadius: PICK_RADIUS }),
  );

  overlay.setProps({
    layers: [
      trackLayers,
      detailLayer,
      studioRouteLayer,
      pickCircleLayer,
      hoveredPointLayer,
      lapMarkerLayers,
    ],
    pickingRadius: PICK_RADIUS,
    _onMetrics: useDeckMetricsStore.getState().update,
  });

  return null;
};
