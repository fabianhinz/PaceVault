import { useCallback, useState } from 'react';

interface SyncedChartZoom {
  zoomRange: { from: number; to: number } | null;
  zoomed: boolean;
  onZoomComplete: (from: string | number, to: string | number) => void;
  resetZoom: () => void;
}

export const useSyncedChartZoom = (): SyncedChartZoom => {
  const [zoomRange, setZoomRange] = useState<{ from: number; to: number } | null>(null);

  const onZoomComplete = useCallback((from: string | number, to: string | number) => {
    setZoomRange({ from: Number(from), to: Number(to) });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  return { zoomRange, zoomed: zoomRange !== null, onZoomComplete, resetZoom };
};
