import { useRef, type PointerEvent } from 'react';
import { useDragControls, type DragControls } from 'motion/react';
import { SHEET_DRAG_ELASTIC, SHEET_MOMENTUM } from '../lib/sheetDrag.ts';

interface GrabberDragProps {
  drag: 'y';
  dragListener: false;
  dragControls: DragControls;
  dragElastic: number;
  dragTransition: typeof SHEET_MOMENTUM;
  onDragStart: () => void;
}

interface GrabberDrag {
  onHandlePointerDown: (event: PointerEvent) => void;
  isDragged: () => boolean;
  dragProps: GrabberDragProps;
}

export const useGrabberDrag = (): GrabberDrag => {
  const dragControls = useDragControls();
  const draggedRef = useRef(false);

  const onHandlePointerDown = (event: PointerEvent) => {
    draggedRef.current = false;
    dragControls.start(event);
  };

  const isDragged = () => draggedRef.current;

  const dragProps: GrabberDragProps = {
    drag: 'y',
    dragListener: false,
    dragControls,
    dragElastic: SHEET_DRAG_ELASTIC,
    dragTransition: SHEET_MOMENTUM,
    onDragStart: () => {
      draggedRef.current = true;
    },
  };

  return { onHandlePointerDown, isDragged, dragProps };
};
