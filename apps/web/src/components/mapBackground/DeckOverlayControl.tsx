import type { FC } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { Layer, type LayersList } from '@deck.gl/core';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { PICK_RADIUS } from './trackPicking.ts';

const NOTHING_DRAWN = () => {};

const freshLayers = (layers: LayersList): LayersList =>
  layers.map((layer) => {
    if (Array.isArray(layer)) return freshLayers(layer);
    if (layer instanceof Layer) return layer.clone({});
    return layer;
  });

interface DeckOverlayControlProps {
  layers: LayersList;
  hoveringTrack: boolean;
  onDrawn: (() => void) | undefined;
}

export const DeckOverlayControl: FC<DeckOverlayControlProps> = (props) => {
  const interleaved = !useDevice().pointerFine;
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ pickingRadius: PICK_RADIUS, interleaved }),
  );

  overlay.setProps({
    layers: freshLayers(props.layers),
    pickingRadius: PICK_RADIUS,
    getCursor: () => (props.hoveringTrack ? 'pointer' : ''),
    onAfterRender: props.onDrawn ?? NOTHING_DRAWN,
  });

  return null;
};
