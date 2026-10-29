import { useCallback, useState } from 'react';

type TrackRenderer = 'deck' | 'terrain';

interface MapRendererHandOver {
  deckShown: boolean;
  terrainMounted: boolean;
  onTerrainDrawn: (() => void) | undefined;
  onDeckDrawn: (() => void) | undefined;
}

export const useMapRendererHandOver = ({
  terrain,
  mapLoaded,
}: {
  terrain: boolean;
  mapLoaded: boolean;
}): MapRendererHandOver => {
  const [drawnBy, setDrawnBy] = useState<TrackRenderer>('deck');
  const terrainDrawn = useCallback(() => setDrawnBy('terrain'), []);
  const deckDrawn = useCallback(() => setDrawnBy('deck'), []);
  const handOver: MapRendererHandOver = {
    deckShown: !terrain || drawnBy === 'deck',
    terrainMounted: mapLoaded && (terrain || drawnBy === 'terrain'),
    onTerrainDrawn: undefined,
    onDeckDrawn: undefined,
  };
  if (terrain && drawnBy === 'deck') handOver.onTerrainDrawn = terrainDrawn;
  if (!terrain && drawnBy === 'terrain') handOver.onDeckDrawn = deckDrawn;
  return handOver;
};
