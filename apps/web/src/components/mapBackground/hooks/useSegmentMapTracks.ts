import { useMemo } from 'react';
import type { GPSBounds } from '@pacevault/engine/types.ts';
import { useRouteMatch } from '@/routing/useRouteMatch.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { resolveDashboardTab } from '@/routing/dashboardTab.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { useSegments } from '@/components/segments/hooks/useSegments.ts';
import { useFilteredSegments } from '@/components/segments/hooks/useFilteredSegments.ts';
import { segmentBounds } from '@/components/mapBackground/segmentBounds.ts';
import { representedSessionIds } from '@/components/segments/segmentFilter.ts';

export type SegmentMapMode = 'off' | 'tab' | 'page';

interface SegmentMapTracks {
  mode: SegmentMapMode;
  segments: Segment[];
  pageSegmentId: string | null;
  bounds: GPSBounds | null;
  representedSessionIds: Set<string> | null;
}

const NO_SEGMENTS: Segment[] = [];

const OFF: SegmentMapTracks = {
  mode: 'off',
  segments: NO_SEGMENTS,
  pageSegmentId: null,
  bounds: null,
  representedSessionIds: null,
};

const pageTracks = ({
  segments,
  segmentId,
}: {
  segments: Segment[] | undefined;
  segmentId: string;
}): SegmentMapTracks => {
  const segment = segments?.find((candidate) => candidate.id === segmentId);
  if (segment === undefined) return { ...OFF, mode: 'page', pageSegmentId: segmentId };
  return {
    mode: 'page',
    segments: [segment],
    pageSegmentId: segmentId,
    bounds: segmentBounds(segment),
    representedSessionIds: null,
  };
};

const tabTracks = ({
  segments,
  updating,
}: {
  segments: Segment[] | undefined;
  updating: boolean;
}): SegmentMapTracks => {
  let represented: Set<string> | null = null;
  if (segments !== undefined && !updating) represented = representedSessionIds(segments);
  return {
    ...OFF,
    mode: 'tab',
    segments: segments ?? NO_SEGMENTS,
    representedSessionIds: represented,
  };
};

export const useSegmentMapTracks = (): SegmentMapTracks => {
  const dashboardMatch = useRouteMatch('dashboard');
  const pageMatch = useRouteMatch('segmentDetail');
  const rawTab = useRouterParam('tab') ?? null;
  const onTab = dashboardMatch !== null && resolveDashboardTab(rawTab) === 'segments';
  const pageSegmentId = pageMatch?.id ?? null;
  const tabState = useFilteredSegments({ enabled: onTab });
  const tabSegments = tabState.segments;
  const tabUpdating = tabState.updating;
  const allSegments = useSegments({ enabled: pageSegmentId !== null }).segments;

  return useMemo(() => {
    if (pageSegmentId !== null)
      return pageTracks({ segments: allSegments, segmentId: pageSegmentId });
    if (onTab) return tabTracks({ segments: tabSegments, updating: tabUpdating });
    return OFF;
  }, [pageSegmentId, allSegments, onTab, tabSegments, tabUpdating]);
};
