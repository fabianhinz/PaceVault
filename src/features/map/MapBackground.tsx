import { useRef, useEffect, useState, useCallback } from 'react';
import { useMatch } from 'react-router-dom';
import MapGL from 'react-map-gl/maplibre';
import type { PickingInfo } from '@deck.gl/core';
import { styles } from './mapStyle.ts';
import { useMapTracks } from './hooks/useMapTracks.ts';
import { useGPSBackfill } from './hooks/useGpsBackfill.ts';
import { useMapCameraEffect } from './hooks/useMapCameraEffect.ts';
import { useStudioMapTracks } from './hooks/useStudioMapTracks.ts';
import { useMapPopupState } from './hooks/useMapPopupState.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { StudioMarkerPins } from '../studio/markers/StudioMarkerPins.tsx';
import { StudioTrackPickPopup } from '../studio/markers/StudioTrackPickPopup.tsx';
import { StudioRoutesPickPopup } from '../studio/markers/StudioRoutesPickPopup.tsx';
import { useStudioMapPopup } from '../studio/hooks/useStudioMapPopup.ts';
import { useStudioRoutesPopup } from '../studio/hooks/useStudioRoutesPopup.ts';
import { SessionsPickPopup } from '../sessions/SessionsPickPopup.tsx';
import { LapPickPopup } from '../sessions/laps/LapPickPopup.tsx';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useWatchPositionEffect } from '@/lib/hooks/useWatchPositionEffect.ts';
import { useGeolocationCameraEffect } from './hooks/useGeolocationCameraEffect.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map-attribution.css';

export const MapBackground = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<MapRef>(null);

  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const popupState = useMapPopupState(mapRef, mapTracks.tracks);
  const studioPopup = useStudioMapPopup();
  const studioRoutesPopup = useStudioRoutesPopup(mapRef);
  const focusedLaps = useMapFocusStore((s) => s.focusedLaps);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);
  const focusedRecords = useMapFocusStore((s) => s.focusedRecords);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const focusedTripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);
  const studioTracks = useStudioMapTracks();

  useWatchPositionEffect();
  useGeolocationCameraEffect(mapRef);

  const match = useMatch('/sessions/:id');
  useEffect(() => {
    useMapFocusStore.getState().setOpenedSession(match?.params.id ?? null);
  }, [match?.params.id]);

  useMapCameraEffect(
    mapRef,
    mapTracks.tracks,
    openedSessionId,
    mapLoaded,
    focusedTripSessionIds.length > 0,
    studioTracks.bounds,
  );

  const sessionsOnClick = popupState.onClick;
  const studioOnClick = studioPopup.onClick;
  const routesOnClick = studioRoutesPopup.onClick;

  const onMapClick = useCallback(
    (info: PickingInfo) => {
      if (info.layer?.id === 'studio-routes') {
        if (studioTracks.focusedRouteId) {
          studioOnClick(info);
        } else {
          routesOnClick(info);
        }
        return;
      }
      return sessionsOnClick(info);
    },
    [sessionsOnClick, studioOnClick, routesOnClick, studioTracks.focusedRouteId],
  );

  const interactive = popupState.interactive && !studioPopup.popup && !studioRoutesPopup.popup;

  return (
    <div className="fixed inset-0 z-0" onPointerLeave={popupState.onPointerLeave}>
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={styles.dark}
        cursor={popupState.hoveringTrack ? 'pointer' : undefined}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        scrollZoom={interactive}
        dragPan={interactive}
        doubleClickZoom={interactive}
        keyboard={interactive}
        touchZoomRotate={interactive}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay
          tracks={mapTracks.tracks}
          onClick={onMapClick}
          onHover={popupState.onHover}
        />
        {studioTracks.focusedRouteId && <StudioMarkerPins routeId={studioTracks.focusedRouteId} />}
      </MapGL>
      {studioPopup.popup && (
        <StudioTrackPickPopup info={studioPopup.popup} onClose={studioPopup.close} />
      )}
      {studioRoutesPopup.popup && (
        <StudioRoutesPickPopup info={studioRoutesPopup.popup} onClose={studioRoutesPopup.close} />
      )}
      {popupState.popup && (
        <SessionsPickPopup info={popupState.popup} onClose={popupState.closePopup} />
      )}
      {popupState.lapPopup && focusedSport && (
        <LapPickPopup
          info={popupState.lapPopup}
          laps={focusedLaps}
          records={focusedRecords}
          sport={focusedSport}
          onClose={popupState.closePopup}
        />
      )}
    </div>
  );
};
