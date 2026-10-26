import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { trackModifiers } from '@/components/mapBackground/trackColors.ts';
import { PICK_RADIUS } from '@/components/mapBackground/trackPicking.ts';

interface PickLayers {
  pickCircleLayer: Layer | null;
  hoveredPointLayer: Layer;
}

export const usePickLayers = (terrain: boolean): PickLayers => {
  const hoveredPoint = useMapFocusStore((s) => {
    if (terrain) return null;
    return s.hoveredPoint;
  });
  const pickCircle = useMapFocusStore((s) => {
    if (terrain) return null;
    return s.pickCircle;
  });

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle || terrain) {
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
  }, [pickCircle, terrain]);

  const hoveredPointLayer = useMemo(() => {
    let data: Array<{ position: [number, number] }> = [];
    if (hoveredPoint) data = [{ position: hoveredPoint }];

    return new ScatterplotLayer<{ position: [number, number] }>({
      id: 'hovered-point',
      data,
      visible: hoveredPoint !== null,
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

  return { pickCircleLayer, hoveredPointLayer };
};
