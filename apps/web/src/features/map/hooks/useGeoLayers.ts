import { useMemo } from 'react';
import type { LayersList } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useGeolocationStore } from '@/store/geolocation.ts';
import {
  geoAccuracyFill,
  geoAccuracyLine,
  geoDotFill,
  geoDotLine,
} from '@/features/map/trackColors.ts';

export const useGeoLayers = (terrain: boolean): LayersList | null => {
  const geoPosition = useGeolocationStore((s) => s.position);
  const geoAccuracy = useGeolocationStore((s) => s.accuracy);

  return useMemo(() => {
    if (!geoPosition || terrain) {
      return null;
    }

    const layers = [];

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
  }, [geoPosition, geoAccuracy, terrain]);
};
