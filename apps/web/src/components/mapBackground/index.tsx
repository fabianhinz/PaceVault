import { useDeferredValue, useRef, useState, type FC } from 'react';
import MapGL from 'react-map-gl/maplibre';
import { MAP_MAXZOOM, STYLE_BY_MAP_STYLE } from './mapStyle.ts';
import { useMapTracks } from './hooks/useMapTracks.ts';
import { useSessionGpsTracks } from '@/queries/sessions/useSessionGpsTracks.ts';
import { useStudioMapTracks } from './hooks/useStudioMapTracks.ts';
import { useMapInteraction } from './hooks/useMapInteraction.ts';
import { useMapBackgroundEffects } from './hooks/useMapBackgroundEffects.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { StudioMarkerPins } from '@/components/studio/markers/StudioMarkerPins.tsx';
import { StudioTrackPickPopup } from '@/components/studio/markers/StudioTrackPickPopup.tsx';
import { StudioRoutesPickPopup } from '@/components/studio/markers/StudioRoutesPickPopup.tsx';
import { SessionsPickPopup } from '@/components/sessions/SessionsPickPopup.tsx';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map-attribution.css';

export const MapBackground: FC = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const pointerFine = useDevice().pointerFine;
  const terrainSelected = useMapControlsStore((s) => s.sessionMapView === '3d');
  // The first terrain build is expensive; the toggle repaints before the map switches.
  const terrain = useDeferredValue(terrainSelected);
  const terrainTrackHovered = useMapControlsStore((s) => s.terrainTrackHovered);

  const gpsTracks = useSessionGpsTracks();
  const gpsData = gpsTracks.data ?? null;
  const tracks = useMapTracks(gpsData);
  const interaction = useMapInteraction({ mapRef, tracks });
  const studioTracks = useStudioMapTracks();
  useMapBackgroundEffects({ mapRef, mapLoaded });

  return (
    <div className="fixed inset-0 z-0" onPointerLeave={interaction.popupState.onPointerLeave}>
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={STYLE_BY_MAP_STYLE.dark}
        maxZoom={MAP_MAXZOOM}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        scrollZoom={interaction.interactive}
        dragPan={interaction.interactive}
        doubleClickZoom={interaction.interactive && !terrain}
        keyboard={interaction.interactive}
        touchZoomRotate={interaction.interactive}
        dragRotate={terrain}
        pitchWithRotate
        touchPitch={terrain}
        boxZoom={false}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
        cursor={interaction.popupState.hoveringTrack || terrainTrackHovered ? 'pointer' : undefined}
      >
        <DeckGLOverlay
          key={pointerFine ? 'overlaid' : 'interleaved'}
          tracks={tracks}
          onClick={interaction.onMapClick}
          onHover={interaction.popupState.onHover}
          hoveringTrack={interaction.popupState.hoveringTrack}
          gpsData={gpsData}
          mapLoaded={mapLoaded}
          terrain={terrain}
        />
        {studioTracks.focusedRouteId && <StudioMarkerPins routeId={studioTracks.focusedRouteId} />}
      </MapGL>
      {interaction.studioPopup.popup && (
        <StudioTrackPickPopup
          info={interaction.studioPopup.popup}
          onClose={interaction.studioPopup.close}
        />
      )}
      {interaction.studioRoutesPopup.popup && (
        <StudioRoutesPickPopup
          info={interaction.studioRoutesPopup.popup}
          onClose={interaction.studioRoutesPopup.close}
        />
      )}
      {interaction.popupState.popup && (
        <SessionsPickPopup
          info={interaction.popupState.popup}
          onClose={interaction.popupState.closePopup}
        />
      )}
    </div>
  );
};
