import { useState, useCallback, useEffect, useRef } from 'react';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

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
  isZoomed: boolean;
  onMouseDown: (e: MouseHandlerDataParam) => void;
  onMouseMove: (e: MouseHandlerDataParam) => void;
  onMouseUp: () => void;
  resetZoom: () => void;
}

export const useChartZoom = <T>(options: UseChartZoomOptions<T>): UseChartZoomReturn<T> => {
  const data = options.data;
  const xKey = options.xKey;
  const onZoomComplete = options.onZoomComplete;
  const onClick = options.onClick;
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [prevData, setPrevData] = useState(data);
  const pressedLabel = useRef<string | number | null>(null);

  if (data !== prevData) {
    setPrevData(data);
    setStartIndex(null);
    setEndIndex(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }

  useEffect(() => {
    if (refAreaLeft === null) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [refAreaLeft]);

  const onMouseDown = useCallback((e: MouseHandlerDataParam) => {
    if (e.activeLabel == null) return;
    pressedLabel.current = e.activeLabel;
    setRefAreaLeft(e.activeLabel);
    setRefAreaRight(null);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseHandlerDataParam) => {
      if (refAreaLeft !== null && e.activeLabel != null) {
        setRefAreaRight(e.activeLabel);
      }
    },
    [refAreaLeft],
  );

  const onMouseUp = useCallback(() => {
    const pressed = pressedLabel.current;
    pressedLabel.current = null;
    if (pressed === null) return;
    if (refAreaRight === null || refAreaRight === pressed) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      onClick?.(pressed);
      return;
    }

    let leftIdx = data.findIndex((d) => d[xKey] === pressed);
    let rightIdx = data.findIndex((d) => d[xKey] === refAreaRight);

    if (leftIdx < 0 || rightIdx < 0) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    if (leftIdx > rightIdx) {
      [leftIdx, rightIdx] = [rightIdx, leftIdx];
    }

    setStartIndex(leftIdx);
    setEndIndex(rightIdx);
    setRefAreaLeft(null);
    setRefAreaRight(null);

    const leftItem = data[leftIdx];
    const rightItem = data[rightIdx];
    if (leftItem && rightItem) {
      onZoomComplete?.(String(leftItem[xKey]), String(rightItem[xKey]));
    }
  }, [data, xKey, refAreaRight, onZoomComplete, onClick]);

  const resetZoom = useCallback(() => {
    setStartIndex(null);
    setEndIndex(null);
  }, []);

  const isZoomed = startIndex !== null;
  let zoomedData = data;
  if (isZoomed && endIndex !== null) {
    zoomedData = data.slice(startIndex, endIndex + 1);
  }

  return {
    zoomedData,
    refAreaLeft,
    refAreaRight,
    isZoomed,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    resetZoom,
  };
};
