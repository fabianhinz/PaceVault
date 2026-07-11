import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils.ts';
import { useMatch } from 'react-router-dom';
import MapGL from 'react-map-gl/maplibre';
import { darkMatterStyle } from './mapStyle.ts';
import { useMapTracks } from './hooks/useMapTracks.ts';
import { useGPSBackfill } from './hooks/useGpsBackfill.ts';
import { useMapCameraEffect } from './hooks/useMapCameraEffect.ts';
import { useStudioMapTracks } from './hooks/useStudioMapTracks.ts';
import { useMapPopupState } from './hooks/useMapPopupState.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { DeckMetricsOverlay } from './DeckMetricsOverlay.tsx';
import { SessionsPickPopup } from '../sessions/SessionsPickPopup.tsx';
import { LapPickPopup } from '../sessions/laps/LapPickPopup.tsx';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map-attribution.css';

const PROGRESS_SIZE = 20;
const PROGRESS_STROKE = 2.5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

interface MapBackgroundProps {
  className?: string;
}

export const MapBackground = (props: MapBackgroundProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<MapRef>(null);

  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const popupState = useMapPopupState(mapRef, mapTracks.tracks);
  const focusedLaps = useMapFocusStore((s) => s.focusedLaps);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);
  const focusedRecords = useMapFocusStore((s) => s.focusedRecords);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const focusedTripSessionIds = useMapFocusStore((s) => s.focusedTripSessionIds);
  const studioTracks = useStudioMapTracks();

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

  const backfillPct =
    backfill.total > 0 ? Math.min(backfill.processed, backfill.total) / backfill.total : 0;
  const backfillOffset = PROGRESS_CIRCUMFERENCE * (1 - backfillPct);

  return (
    <div
      className={cn('fixed inset-0 z-0', props.className)}
      onPointerLeave={popupState.onPointerLeave}
    >
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={darkMatterStyle}
        cursor={popupState.hoveringTrack ? 'pointer' : undefined}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        scrollZoom={popupState.interactive}
        dragPan={popupState.interactive}
        doubleClickZoom={popupState.interactive}
        keyboard={popupState.interactive}
        touchZoomRotate={popupState.interactive}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay
          tracks={mapTracks.tracks}
          onClick={popupState.onClick}
          onHover={popupState.onHover}
        />
      </MapGL>
      <DeckMetricsOverlay />
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
      {backfill.backfilling && (
        <svg
          width={PROGRESS_SIZE}
          height={PROGRESS_SIZE}
          className="absolute top-4 left-4 -rotate-90"
        >
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={PROGRESS_STROKE}
            className="text-white/10"
          />
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={PROGRESS_STROKE}
            strokeDasharray={PROGRESS_CIRCUMFERENCE}
            strokeDashoffset={backfillOffset}
            strokeLinecap="round"
            className="text-accent transition-[stroke-dashoffset] duration-500"
          />
        </svg>
      )}
    </div>
  );
};
