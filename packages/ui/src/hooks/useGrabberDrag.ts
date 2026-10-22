import { useRef, type PointerEvent } from 'react';
import { useDragControls } from 'motion/react';
import { SHEET_MOMENTUM } from '../lib/sheetDrag.ts';

export const useGrabberDrag = () => {
  const dragControls = useDragControls();
  const draggedRef = useRef(false);

  const onHandlePointerDown = (event: PointerEvent) => {
    draggedRef.current = false;
    dragControls.start(event);
  };

  const wasDragged = () => draggedRef.current;

  const dragProps = {
    drag: 'y' as const,
    dragListener: false,
    dragControls,
    dragElastic: 0.08,
    dragTransition: SHEET_MOMENTUM,
    onDragStart: () => {
      draggedRef.current = true;
    },
  };

  return { onHandlePointerDown, wasDragged, dragProps };
};
