import { useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useSessionDetailPath } from './hooks/useSessionDetailPath.ts';
import type { DetailPath } from './zoneColoredPath.ts';
import {
  ADDITIVE_BLEND,
  geoAccuracyFill,
  geoAccuracyLine,
  geoDotFill,
  geoDotLine,
  sportMarkerColor,
  sportTrackColor,
  trackModifiers,
} from './trackColors.ts';
import type { LapMarker } from '@/lib/lapMarkers.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useDeckMetricsStore } from '@/store/deckMetrics.ts';
import type { MapTrack } from './hooks/useMapTracks.ts';
import { decodeCached, PICK_RADIUS, type TrackPickData } from './hooks/types.ts';
import { useStudioMapTracks } from './hooks/useStudioMapTracks.ts';
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
  const geoPosition = useGeolocationStore((s) => s.position);
  const geoAccuracy = useGeolocationStore((s) => s.accuracy);
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

  // One path per GPX segment — disconnected segments must not be joined.
  // Memoized separately from hover state so hovering a route card keeps the
  // data identity stable and deck.gl only re-evaluates the triggered accessors.
  const studioSegments = useMemo(
    () =>
      studioTracks.routes.flatMap((route) =>
        route.encodedPolylines.map((encodedPolyline, segIndex) => ({
          routeId: route.id,
          segIndex,
          encodedPolyline,
          color: route.color,
        })),
      ),
    [studioTracks.routes],
  );

  const studioRouteLayer = useMemo(() => {
    if (studioSegments.length === 0) {
      return null;
    }

    // Same highlight pattern as the session tracks: translucent by default,
    // full opacity + wider stroke for the hovered route or the one whose
    // detail page is open, everything else hidden while a route is hovered.
    const highlightedRouteId = hoveredStudioRouteId ?? studioTracks.focusedRouteId;

    return new PathLayer<(typeof studioSegments)[number]>({
      id: 'studio-routes',
      data: studioSegments,
      getPath: (d) => decodeCached(`studio-${d.routeId}-${d.segIndex}`, d.encodedPolyline),
      getColor: (d) => {
        let alpha = trackModifiers.alpha.default;
        if (hoveredStudioRouteId && hoveredStudioRouteId !== d.routeId) {
          alpha = 0;
        } else if (highlightedRouteId === d.routeId) {
          alpha = trackModifiers.alpha.highlighted;
        }
        return [d.color[0], d.color[1], d.color[2], alpha];
      },
      getWidth: (d) =>
        d.routeId === highlightedRouteId
          ? trackModifiers.width.highlighted
          : trackModifiers.width.default,
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      // Pickable across the whole studio context: the detail page drops markers
      // on its route, the studio tab lists the routes near the click.
      pickable: studioTracks.active,
      updateTriggers: {
        getColor: [highlightedRouteId, hoveredStudioRouteId],
        getWidth: [highlightedRouteId],
      },
      transitions: {
        getWidth: 300,
        getColor: 300,
      },
      parameters: ADDITIVE_BLEND,
      // Without the shared click/hover handlers the pickable flag does nothing —
      // deck routes picks through per-layer handlers, and onHover is what lights
      // up the pick circle on the track.
      ...eventHandlers,
    });
  }, [
    studioSegments,
    studioTracks.active,
    studioTracks.focusedRouteId,
    hoveredStudioRouteId,
    eventHandlers,
  ]);

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

  const geoLayers = useMemo(() => {
    if (!geoPosition) {
      return null;
    }

    const layers = [];

    // Accuracy disc — real-world radius in meters, so it shrinks/grows with the
    // GPS uncertainty as the map zooms.
    if (geoAccuracy) {
      layers.push(
        new ScatterplotLayer<{ center: [number, number] }>({
          id: 'geo-accuracy',
          data: [{ center: geoPosition }],
          getPosition: (d) => d.center,
          getRadius: geoAccuracy,
          radiusUnits: 'meters',
          filled: true,
          getFillColor: geoAccuracyFill,
          stroked: true,
          getLineColor: geoAccuracyLine,
          lineWidthUnits: 'pixels' as const,
          getLineWidth: 1,
          pickable: false,
        }),
      );
    }

    // Position dot — constant pixel size so it stays legible at any zoom.
    layers.push(
      new ScatterplotLayer<{ position: [number, number] }>({
        id: 'geo-dot',
        data: [{ position: geoPosition }],
        getPosition: (d) => d.position,
        getRadius: 7,
        radiusUnits: 'pixels',
        filled: true,
        getFillColor: geoDotFill,
        stroked: true,
        getLineColor: geoDotLine,
        lineWidthUnits: 'pixels' as const,
        getLineWidth: 2,
        pickable: false,
      }),
    );

    return layers;
  }, [geoPosition, geoAccuracy]);

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
      geoLayers,
    ],
    pickingRadius: PICK_RADIUS,
    _onMetrics: useDeckMetricsStore.getState().update,
  });

  return null;
};
