import { useMemo } from 'react';
import type { GPSBounds, SessionGPS } from '@pacevault/engine/types.ts';
import type { MapCameraTarget } from '@/components/mapBackground/mapCamera.ts';
import type { FilterCriteria } from '@/lib/filtering/filters.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingActive } from '@/store/hooks/useSessionReprocessingActive.ts';
import type { MapTrack } from './types.ts';
import { useStudioMapTracks } from './useStudioMapTracks.ts';
import { useSessionFitBounds } from './useSessionFitBounds.ts';
import { useMapCameraTarget } from './useMapCameraTarget.ts';
import { useSegmentMapTracks } from './useSegmentMapTracks.ts';
import { useMapScene } from './useMapScene.ts';
import { sceneSessionId, sceneTripSessionIds } from '@/components/mapBackground/mapScene.ts';

interface MapCameraInputs {
  target: MapCameraTarget;
  studioBounds: GPSBounds | null;
  segmentBounds: GPSBounds | null;
  tripSessionIds: string[];
  lapCloseCount: number;
  refitRequest: number;
  filter: FilterCriteria | null;
  sessionDataBlocked: boolean;
  progressOverlayOpen: boolean;
  sessionBounds: GPSBounds | null;
  visibleKey: string;
}

export const useMapCameraInputs = ({
  gpsData,
  tracks,
}: {
  gpsData: SessionGPS[] | null;
  tracks: MapTrack[];
}): MapCameraInputs => {
  const target = useMapCameraTarget();
  const studioBounds = useStudioMapTracks().bounds;
  const segmentBounds = useSegmentMapTracks().bounds;
  const scene = useMapScene();
  const tripSessionIds = sceneTripSessionIds(scene);
  const lapCloseCount = useMapControlsStore((s) => s.lapCloseCount);
  const refitRequest = useMapFocusStore((s) => s.mapRefitRequest);
  const filter = useFiltersStore((s) => s.activeFilter);
  const sessionDataBlocked = useSessionReprocessingActive();
  const progressOverlayOpen = useImportProgressStore(
    (s) => s.foreground !== null || s.awaitingTrackBuild,
  );
  const sessionBounds = useSessionFitBounds({ gpsData, sessionId: sceneSessionId(scene) });
  const visibleKey = useMemo(() => tracks.map((t) => t.sessionId).join(','), [tracks]);

  return {
    target,
    studioBounds,
    segmentBounds,
    tripSessionIds,
    lapCloseCount,
    refitRequest,
    filter,
    sessionDataBlocked,
    progressOverlayOpen,
    sessionBounds,
    visibleKey,
  };
};
