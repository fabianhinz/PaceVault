import { useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { useSessionDetailPath } from './hooks/useSessionDetailPath.ts';
import { useLapCameraEffect } from './hooks/useLapCameraEffect.ts';
import { dimmedColor, lapSubPath, nearestRecordIndex } from './lapPath.ts';
import type { DetailPath } from './zoneColoredPath.ts';
import {
  ADDITIVE_BLEND,
  studioRouteModifiers,
  geoAccuracyFill,
  geoAccuracyLine,
  geoDotFill,
  geoDotLine,
  sportTrackColor,
  trackModifiers,
} from './trackColors.ts';
import { lapIndexAtRecord, type LapSpan } from '@/lib/lapRanges.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import type { MapTrack } from './hooks/useMapTracks.ts';
import { decodeCached, PICK_RADIUS, type TrackPickData } from './hooks/types.ts';
import { useStudioMapTracks } from './hooks/useStudioMapTracks.ts';
import { useControl } from 'react-map-gl/maplibre';

type PickHandler = (info: PickingInfo, event: unknown) => boolean | void;

const lapPathFor = (
  detailPath: DetailPath | null,
  spans: LapSpan[] | undefined,
  lapIndex: number | null,
): DetailPath | null => {
  if (lapIndex === null || !detailPath || !spans) return null;
  const span = spans.find((candidate) => candidate.lapIndex === lapIndex);
  if (!span) return null;
  return lapSubPath(detailPath, span);
};

const DIMMED_BRIGHTNESS = 0.3;
const LAP_CASING_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const LAP_HOVER_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const LAP_CASING_SCALE = 1.6;

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
  const lapSpans = useMapFocusStore((s) => s.sessionLaps?.spans);
  const selectedLapIndex = useMapFocusStore((s) => s.selectedLapIndex);
  const hoveredLapIndex = useMapFocusStore((s) => s.hoveredLapIndex);
  const trackColorMode = useMapFocusStore((s) => s.trackColorMode);
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

  const selectedLapPath = useMemo(
    () => lapPathFor(detailPath, lapSpans, selectedLapIndex),
    [selectedLapIndex, detailPath, lapSpans],
  );
  let previewLapIndex = hoveredLapIndex;
  if (previewLapIndex === selectedLapIndex) {
    previewLapIndex = null;
  }
  const hoveredLapPath = useMemo(
    () => lapPathFor(detailPath, lapSpans, previewLapIndex),
    [previewLapIndex, detailPath, lapSpans],
  );

  useLapCameraEffect(selectedLapPath?.path ?? null, detailPath?.path ?? null);

  const detailHandlers = useMemo(() => {
    const lapAt = (info: PickingInfo) => {
      if (!detailPath || !lapSpans || !info.coordinate) return undefined;
      const lng = info.coordinate[0];
      const lat = info.coordinate[1];
      if (lng === undefined || lat === undefined) return undefined;
      const recordIndex = nearestRecordIndex(detailPath, [lng, lat]);
      if (recordIndex === undefined) return undefined;
      return lapIndexAtRecord(lapSpans, recordIndex);
    };
    const onClick: PickHandler = (info, event) => {
      const lapIndex = lapAt(info);
      if (lapIndex === undefined) return eventHandlers.onClick?.(info, event);
      useMapFocusStore.getState().toggleSelectedLap(lapIndex);
      return true;
    };
    const onHover: PickHandler = (info, event) => {
      let lapIndex: number | null = null;
      if (info.object) {
        lapIndex = lapAt(info) ?? null;
      }
      useMapFocusStore.getState().setHoveredLap(lapIndex);
      return eventHandlers.onHover?.(info, event);
    };
    if (!eventHandlers.onClick) return {};
    return { onClick, onHover };
  }, [detailPath, lapSpans, eventHandlers]);

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

    const isDimmed = selectedLapPath !== null;
    return new PathLayer<DetailPath>({
      id: 'session-detail',
      data: [detailPath],
      getPath: (d) => d.path,
      getColor: (d) => {
        if (isDimmed) return dimmedColor(d.color, DIMMED_BRIGHTNESS);
        return d.color;
      },
      getWidth: trackModifiers.width.highlighted,
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: true,
      updateTriggers: { getColor: [trackColorMode, openedSessionId, isDimmed] },
      ...detailHandlers,
    });
  }, [detailPath, trackColorMode, openedSessionId, detailHandlers, selectedLapPath]);

  const lapLayers = useMemo(() => {
    const layers = [];
    if (hoveredLapPath) {
      layers.push(
        new PathLayer<DetailPath>({
          id: 'lap-hover',
          data: [hoveredLapPath],
          getPath: (d) => d.path,
          getColor: LAP_HOVER_COLOR,
          getWidth: 3,
          widthUnits: 'pixels',
          jointRounded: true,
          capRounded: true,
          pickable: false,
        }),
      );
    }
    if (selectedLapPath) {
      layers.push(
        new PathLayer<DetailPath>({
          id: 'lap-casing',
          data: [selectedLapPath],
          getPath: (d) => d.path,
          getColor: LAP_CASING_COLOR,
          getWidth: trackModifiers.width.highlighted * LAP_CASING_SCALE,
          widthMinPixels: 9,
          jointRounded: true,
          capRounded: true,
          pickable: false,
        }),
        new PathLayer<DetailPath>({
          id: 'lap-selected',
          data: [selectedLapPath],
          getPath: (d) => d.path,
          getColor: (d) => d.color,
          getWidth: trackModifiers.width.highlighted,
          widthMinPixels: 5,
          jointRounded: true,
          capRounded: true,
          pickable: false,
          updateTriggers: { getColor: [trackColorMode] },
        }),
      );
    }
    return layers;
  }, [hoveredLapPath, selectedLapPath, trackColorMode]);

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

    const highlightedRouteId = hoveredStudioRouteId ?? studioTracks.focusedRouteId;

    return new PathLayer<(typeof studioSegments)[number]>({
      id: 'studio-routes',
      data: studioSegments,
      getPath: (d) => decodeCached(`studio-${d.routeId}-${d.segIndex}`, d.encodedPolyline),
      getColor: (d) => {
        let alpha = studioRouteModifiers.alpha.default;
        if (hoveredStudioRouteId && hoveredStudioRouteId !== d.routeId) {
          alpha = studioRouteModifiers.alpha.hidden;
        }
        return [d.color[0], d.color[1], d.color[2], alpha];
      },
      getWidth: (d) =>
        d.routeId === highlightedRouteId
          ? studioRouteModifiers.width.highlighted
          : studioRouteModifiers.width.default,
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
    () => new MapboxOverlay({ pickingRadius: PICK_RADIUS, interleaved: true }),
  );

  overlay.setProps({
    layers: [
      trackLayers,
      detailLayer,
      studioRouteLayer,
      pickCircleLayer,
      lapLayers,
      hoveredPointLayer,
      geoLayers,
    ],
    pickingRadius: PICK_RADIUS,
    onClick: (info) => {
      if (!info.picked && openedSessionId) useMapFocusStore.getState().clearSelectedLap();
    },
  });

  return null;
};
