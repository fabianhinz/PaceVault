import type { FC } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { Layer, type LayersList } from '@deck.gl/core';
import { PICK_RADIUS } from './hooks/types.ts';

interface DeckOverlayControlProps {
  layers: LayersList;
  interleaved: boolean;
  hoveringTrack: boolean;
  onDrawn: (() => void) | undefined;
}

const NOTHING_DRAWN = () => {};

const freshLayers = (layers: LayersList): LayersList =>
  layers.map((layer) => {
    if (Array.isArray(layer)) return freshLayers(layer);
    if (layer instanceof Layer) return layer.clone({});
    return layer;
  });

export const DeckOverlayControl: FC<DeckOverlayControlProps> = (props) => {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ pickingRadius: PICK_RADIUS, interleaved: props.interleaved }),
  );

  overlay.setProps({
    layers: freshLayers(props.layers),
    pickingRadius: PICK_RADIUS,
    getCursor: () => (props.hoveringTrack ? 'pointer' : ''),
    onAfterRender: props.onDrawn ?? NOTHING_DRAWN,
  });

  return null;
};
