import { useCallback, useRef } from 'react';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { zoomSelection } from '@/lib/chartZoom.ts';
import { useZoomSelectionState } from './useZoomSelectionState.ts';

interface UseChartZoomOptions<T> {
  data: T[];
  xKey: keyof T & string;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onClick?: (x: string | number) => void;
}

interface UseChartZoomReturn<T> {
  zoomedData: T[];
  refAreaLeft: string | number | null;
  refAreaRight: string | number | null;
  zoomed: boolean;
  onMouseDown: (e: MouseHandlerDataParam) => void;
  onMouseMove: (e: MouseHandlerDataParam) => void;
  onMouseUp: () => void;
  resetZoom: () => void;
}

export const useChartZoom = <T>({
  data,
  xKey,
  onZoomComplete,
  onClick,
}: UseChartZoomOptions<T>): UseChartZoomReturn<T> => {
  const selection = useZoomSelectionState(data);
  const pressedLabel = useRef<string | number | null>(null);

  const updates = selection.updates;
  const refAreaLeft = selection.refAreaLeft;
  const refAreaRight = selection.refAreaRight;

  const onMouseDown = useCallback(
    (e: MouseHandlerDataParam) => {
      if (e.activeLabel == null) return;
      pressedLabel.current = e.activeLabel;
      updates.press(e.activeLabel);
    },
    [updates],
  );

  const onMouseMove = useCallback(
    (e: MouseHandlerDataParam) => {
      if (refAreaLeft !== null && e.activeLabel != null) {
        updates.drag(e.activeLabel);
      }
    },
    [refAreaLeft, updates],
  );

  const onMouseUp = useCallback(() => {
    const pressed = pressedLabel.current;
    pressedLabel.current = null;
    if (pressed === null) return;
    if (refAreaRight === null || refAreaRight === pressed) {
      updates.clear();
      onClick?.(pressed);
      return;
    }
    const range = zoomSelection({ data, xKey, pressed, released: refAreaRight });
    updates.clear();
    if (range === null) return;
    updates.zoomTo(range);
    const leftItem = data[range.left];
    const rightItem = data[range.right];
    if (leftItem && rightItem) {
      onZoomComplete?.(String(leftItem[xKey]), String(rightItem[xKey]));
    }
  }, [data, xKey, refAreaRight, updates, onZoomComplete, onClick]);

  const zoomed = selection.startIndex !== null;
  let zoomedData = data;
  if (selection.startIndex !== null && selection.endIndex !== null) {
    zoomedData = data.slice(selection.startIndex, selection.endIndex + 1);
  }

  return {
    zoomedData,
    refAreaLeft,
    refAreaRight,
    zoomed,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    resetZoom: updates.reset,
  };
};
