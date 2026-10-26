import { useMemo, useState } from 'react';

interface ZoomSelectionUpdates {
  press: (label: string | number) => void;
  drag: (label: string | number) => void;
  clear: () => void;
  zoomTo: (range: { left: number; right: number }) => void;
  reset: () => void;
}

interface ZoomSelectionState {
  refAreaLeft: string | number | null;
  refAreaRight: string | number | null;
  startIndex: number | null;
  endIndex: number | null;
  updates: ZoomSelectionUpdates;
}

export const useZoomSelectionState = <T>(data: T[]): ZoomSelectionState => {
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setStartIndex(null);
    setEndIndex(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }

  const updates = useMemo(
    (): ZoomSelectionUpdates => ({
      press: (label) => {
        setRefAreaLeft(label);
        setRefAreaRight(null);
      },
      drag: (label) => setRefAreaRight(label),
      clear: () => {
        setRefAreaLeft(null);
        setRefAreaRight(null);
      },
      zoomTo: (range) => {
        setStartIndex(range.left);
        setEndIndex(range.right);
      },
      reset: () => {
        setStartIndex(null);
        setEndIndex(null);
      },
    }),
    [],
  );

  return { refAreaLeft, refAreaRight, startIndex, endIndex, updates };
};
