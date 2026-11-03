import { useRef, type PointerEvent, type RefObject } from 'react';

const DRAG_THRESHOLD_PX = 4;

export interface DragScroll {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  dragged: RefObject<boolean>;
}

export const useDragScroll = (): DragScroll => {
  const drag = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null);
  const dragged = useRef(false);

  return {
    onPointerDown: (event) => {
      if (event.pointerType !== 'mouse') return;
      drag.current = {
        startX: event.clientX,
        startLeft: event.currentTarget.scrollLeft,
        moved: false,
      };
    },
    onPointerMove: (event) => {
      const start = drag.current;
      if (start === null) return;
      const deltaPx = event.clientX - start.startX;
      if (!start.moved && Math.abs(deltaPx) < DRAG_THRESHOLD_PX) return;
      start.moved = true;
      event.currentTarget.scrollLeft = start.startLeft - deltaPx;
    },
    onPointerUp: () => {
      dragged.current = drag.current?.moved === true;
      drag.current = null;
    },
    dragged,
  };
};
