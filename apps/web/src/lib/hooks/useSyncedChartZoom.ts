import { useCallback, useState } from 'react';

export const useSyncedChartZoom = () => {
  const [zoomRange, setZoomRange] = useState<{ from: number; to: number } | null>(null);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    setZoomRange({ from: Number(from), to: Number(to) });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  return { zoomRange, isZoomed: zoomRange !== null, onZoomComplete, resetZoom };
};
