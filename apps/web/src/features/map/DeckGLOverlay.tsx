import type { FC } from 'react';
import type { LayersList } from '@deck.gl/core';
import type { SessionGPS } from '@pacevault/engine/types.ts';
import { useMapCameraEffect } from './hooks/useMapCameraEffect.ts';
import { useMapRendererHandOver } from './hooks/useMapRendererHandOver.ts';
import { useOverviewMapControlsEffect } from './hooks/useOverviewMapControlsEffect.ts';
import { useOnboardingPreviewLayer } from './hooks/useOnboardingPreviewLayer.ts';
import { useOnboardingPreviewCameraEffect } from './hooks/useOnboardingPreviewCameraEffect.ts';
import { useDeckEventHandlers } from './hooks/useDeckEventHandlers.ts';
import { useDetailLayers } from './hooks/useDetailLayers.ts';
import { useTrackLayers } from './hooks/useTrackLayers.ts';
import { useStudioRouteLayer } from './hooks/useStudioRouteLayer.ts';
import { usePickLayers } from './hooks/usePickLayers.ts';
import { useGeoLayers } from './hooks/useGeoLayers.ts';
import type { MapTrack, PickHandler } from './hooks/types.ts';
import { DeckOverlayControl } from './DeckOverlayControl.tsx';
import { SessionTerrain } from './SessionTerrain.tsx';

const NO_LAYERS: LayersList = [];

interface DeckGLOverlayProps {
  tracks: MapTrack[];
  onClick?: PickHandler;
  onHover?: PickHandler;
  hoveringTrack: boolean;
  gpsData: SessionGPS[] | null;
  mapLoaded: boolean;
  terrain: boolean;
}

export const DeckGLOverlay: FC<DeckGLOverlayProps> = (props) => {
  const eventHandlers = useDeckEventHandlers({ onClick: props.onClick, onHover: props.onHover });
  const detailLayers = useDetailLayers({ terrain: props.terrain, eventHandlers });
  const handOver = useMapRendererHandOver({ terrain: props.terrain, mapLoaded: props.mapLoaded });
  useOverviewMapControlsEffect(props.tracks);
  useMapCameraEffect({
    gpsData: props.gpsData,
    tracks: props.tracks,
    lapPath: detailLayers.selectedLapPath,
    sessionPath: detailLayers.detailPath,
    mapLoaded: props.mapLoaded,
  });
  useOnboardingPreviewCameraEffect();
  const onboardingPreviewLayer = useOnboardingPreviewLayer();
  const trackLayers = useTrackLayers({ tracks: props.tracks, eventHandlers });
  const studioRouteLayer = useStudioRouteLayer(eventHandlers);
  const pickLayers = usePickLayers(props.terrain);
  const geoLayers = useGeoLayers(props.terrain);

  return (
    <>
      {handOver.terrainMounted && (
        <SessionTerrain detailPath={detailLayers.detailPath} onDrawn={handOver.onTerrainDrawn} />
      )}
      <DeckOverlayControl
        layers={
          handOver.deckShown
            ? [
                onboardingPreviewLayer,
                trackLayers,
                detailLayers.detailLayer,
                studioRouteLayer,
                pickLayers.pickCircleLayer,
                detailLayers.lapHoverLayer,
                detailLayers.lapLayers,
                pickLayers.hoveredPointLayer,
                geoLayers,
              ]
            : NO_LAYERS
        }
        hoveringTrack={props.hoveringTrack}
        onDrawn={handOver.onDeckDrawn}
      />
    </>
  );
};
