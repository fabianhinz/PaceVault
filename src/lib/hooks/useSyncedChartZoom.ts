import { useCallback, useState } from 'react';

/**
 * Shared zoom range for a group of compact charts: zooming one chart filters
 * the data of every synced sibling to the same x range.
 */
export const useSyncedChartZoom = () => {
  const [zoomRange, setZoomRange] = useState<{ from: number; to: number } | null>(null);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    setZoomRange({ from: Number(from), to: Number(to) });
  }, []);

  const onZoomReset = useCallback(() => {
    setZoomRange(null);
  }, []);

  return { zoomRange, onZoomComplete, onZoomReset };
};
