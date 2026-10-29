import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  ORBIT_DRAG_THRESHOLD_PX,
  orbitCamera,
  type OrbitDrag,
} from '@/components/mapBackground/terrainCamera.ts';

const LEFT_BUTTON = 0;

interface OrbitGesture {
  drag: OrbitDrag;
  moved: boolean;
  dragPanEnabled: boolean;
  dragRotateEnabled: boolean;
}

const hasOrbitModifier = (event: MouseEvent): boolean =>
  event.shiftKey || event.ctrlKey || event.metaKey;

const holdHandlers = (map: MapLibreMap) => {
  map.dragPan.disable();
  map.dragRotate.disable();
};

const restoreHandlers = ({ map, gesture }: { map: MapLibreMap; gesture: OrbitGesture }) => {
  if (gesture.dragPanEnabled) map.dragPan.enable();
  if (gesture.dragRotateEnabled) map.dragRotate.enable();
};

const startGesture = ({ map, event }: { map: MapLibreMap; event: MouseEvent }): OrbitGesture => {
  const rect = map.getCanvas().getBoundingClientRect();
  const point: [number, number] = [event.clientX - rect.left, event.clientY - rect.top];
  return {
    drag: {
      startX: event.clientX,
      startY: event.clientY,
      point,
      pivot: map.unproject(point),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    },
    moved: false,
    dragPanEnabled: map.dragPan.isEnabled(),
    dragRotateEnabled: map.dragRotate.isEnabled(),
  };
};

export const useTerrainOrbitEffect = (): void => {
  const map = useMap().current?.getMap();

  useEffect(() => {
    if (map === undefined) return;
    const container = map.getContainer();
    let gesture: OrbitGesture | null = null;
    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== LEFT_BUTTON || !hasOrbitModifier(event)) return;
      gesture = startGesture({ map, event });
      holdHandlers(map);
    };
    const onMouseMove = (event: MouseEvent) => {
      if (gesture === null) return;
      const dx = event.clientX - gesture.drag.startX;
      const dy = event.clientY - gesture.drag.startY;
      if (!gesture.moved && Math.hypot(dx, dy) < ORBIT_DRAG_THRESHOLD_PX) return;
      if (!gesture.moved) holdHandlers(map);
      gesture.moved = true;
      orbitCamera({ map, drag: gesture.drag, dx, dy });
    };
    const onMouseUp = () => {
      if (gesture === null) return;
      restoreHandlers({ map, gesture });
      gesture = null;
    };
    const onContextMenu = (event: MouseEvent) => {
      if (gesture === null && !event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
    };
    container.addEventListener('mousedown', onMouseDown, true);
    container.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      container.removeEventListener('mousedown', onMouseDown, true);
      container.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (gesture !== null) restoreHandlers({ map, gesture });
    };
  }, [map]);
};
