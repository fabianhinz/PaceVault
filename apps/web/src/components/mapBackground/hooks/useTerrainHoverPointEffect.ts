import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { Marker, type Map as MapLibreMap } from 'maplibre-gl';
import { useMapFocusStore } from '@/store/mapFocus.ts';

const HOVER_POINT_CLASS =
  'pointer-events-none size-7 rounded-full border-4 border-map-dot-stroke bg-map-highlight bg-clip-padding';

const placeMarker = ({
  map,
  marker,
  point,
}: {
  map: MapLibreMap;
  marker: Marker;
  point: [number, number] | null;
}) => {
  if (point === null) {
    marker.remove();
    return;
  }
  marker.setLngLat(point);
  if (marker.getElement().parentElement === null) marker.addTo(map);
};

export const useTerrainHoverPointEffect = (): void => {
  const map = useMap().current?.getMap();

  useEffect(() => {
    if (map === undefined) return;
    const element = document.createElement('div');
    element.className = HOVER_POINT_CLASS;
    const marker = new Marker({ element });
    placeMarker({ map, marker, point: useMapFocusStore.getState().hoveredPoint });
    const unsubscribe = useMapFocusStore.subscribe((state, previous) => {
      if (state.hoveredPoint !== previous.hoveredPoint) {
        placeMarker({ map, marker, point: state.hoveredPoint });
      }
    });
    return () => {
      unsubscribe();
      marker.remove();
    };
  }, [map]);
};
