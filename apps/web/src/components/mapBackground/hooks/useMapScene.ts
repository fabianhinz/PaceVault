import { useMemo } from 'react';
import { useCurrentPath } from '@/routing/useCurrentPath.ts';
import { useRouteMatch } from '@/routing/useRouteMatch.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { resolveDashboardTab } from '@/routing/dashboardTab.ts';
import { resolveLabsTab } from '@/routing/labsTab.ts';
import { useTripsStore } from '@/store/trips.ts';
import { mapSceneOf, type MapScene } from '@/components/mapBackground/mapScene.ts';

export const useMapScene = (): MapScene => {
  const path = useCurrentPath();
  const sessionId = useRouteMatch('sessionDetail')?.id;
  const tripId = useRouteMatch('tripDetail')?.id;
  const segmentId = useRouteMatch('segmentDetail')?.id;
  const studioRouteId = useRouteMatch('studioDetail')?.id;
  const rawTab = useRouterParam('tab') ?? null;
  const segmentTab =
    useRouteMatch('dashboard') !== null && resolveDashboardTab(rawTab) === 'segments';
  const studioTab = useRouteMatch('labs') !== null && resolveLabsTab(rawTab) === 'studio';
  const tripSessionIds = useTripsStore((s) => s.trips.find((t) => t.id === tripId)?.sessionIds);

  return useMemo(
    () =>
      mapSceneOf({
        path,
        sessionId,
        tripSessionIds,
        segmentId,
        studioRouteId,
        segmentTab,
        studioTab,
      }),
    [path, sessionId, tripSessionIds, segmentId, studioRouteId, segmentTab, studioTab],
  );
};
