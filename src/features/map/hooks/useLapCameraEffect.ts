import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { MAP_FIT_MARGIN, mapPadding } from '../mapPadding.ts';

const LAP_MAX_ZOOM = 16;

const boundsOf = (path: [number, number][]): [[number, number], [number, number]] | null => {
  const first = path[0];
  if (!first) return null;
  let minLng = first[0];
  let maxLng = first[0];
  let minLat = first[1];
  let maxLat = first[1];
  for (const point of path) {
    minLng = Math.min(minLng, point[0]);
    maxLng = Math.max(maxLng, point[0]);
    minLat = Math.min(minLat, point[1]);
    maxLat = Math.max(maxLat, point[1]);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

export const useLapCameraEffect = (
  lapPath: [number, number][] | null,
  sessionPath: [number, number][] | null,
) => {
  const map = useMap().current;
  const hadLap = useRef(false);

  useEffect(() => {
    if (!map) return;
    let target = lapPath;
    if (!target) {
      if (!hadLap.current) return;
      target = sessionPath;
    }
    hadLap.current = lapPath !== null;
    if (!target) return;
    const bounds = boundsOf(target);
    if (!bounds) return;
    map.fitBounds(bounds, {
      padding: mapPadding(MAP_FIT_MARGIN),
      maxZoom: LAP_MAX_ZOOM,
      duration: 800,
    });
  }, [map, lapPath, sessionPath]);
};
