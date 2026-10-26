import type { Map as MapLibreMap } from 'maplibre-gl';

export interface CameraRuns {
  token: number;
  cancelEase: (() => void) | null;
  limit: { sessionId: string; off: () => void } | null;
}

export const cancelRunning = (runs: CameraRuns) => {
  runs.token += 1;
  runs.cancelEase?.();
  runs.cancelEase = null;
};

export const clearZoomLimit = ({ map, runs }: { map: MapLibreMap; runs: CameraRuns }) => {
  if (runs.limit === null) return;
  runs.limit.off();
  runs.limit = null;
  map.setMinZoom(null);
};
