import { useMemo } from 'react';
import type { GPSBounds } from '@pacevault/engine/types.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { useSegmentDetail } from '@/components/segments/hooks/useSegmentDetail.ts';
import { useFilteredSegments } from '@/components/segments/hooks/useFilteredSegments.ts';
import { unmatchedSegment } from '@/components/segments/segmentPasses.ts';
import type { Segment } from '@/store/segments.ts';
import { sceneSegmentId } from '@/components/mapBackground/mapScene.ts';
import { useMapScene } from './useMapScene.ts';

export type SegmentMapMode = 'off' | 'tab' | 'page';

interface SegmentMapTracks {
  mode: SegmentMapMode;
  segments: MatchedSegment[];
  bounds: GPSBounds | null;
}

const NO_SEGMENTS: MatchedSegment[] = [];

const OFF: SegmentMapTracks = {
  mode: 'off',
  segments: NO_SEGMENTS,
  bounds: null,
};

const pageTracks = ({
  segment,
  matched,
}: {
  segment: Segment | undefined;
  matched: MatchedSegment | undefined;
}): SegmentMapTracks => {
  if (segment === undefined) return { ...OFF, mode: 'page' };
  return {
    mode: 'page',
    segments: [matched ?? unmatchedSegment(segment)],
    bounds: segment.bounds,
  };
};

const tabTracks = (segments: MatchedSegment[] | undefined): SegmentMapTracks => ({
  ...OFF,
  mode: 'tab',
  segments: segments ?? NO_SEGMENTS,
});

export const useSegmentMapTracks = (): SegmentMapTracks => {
  const scene = useMapScene();
  const onTab = scene.kind === 'segmentTab';
  const pageSegmentId = sceneSegmentId(scene);
  const tabSegments = useFilteredSegments({ enabled: onTab });
  const segmentDetail = useSegmentDetail(pageSegmentId ?? undefined);
  const pageSegment = segmentDetail.segment;
  const pageMatched = segmentDetail.matched;

  return useMemo(() => {
    if (pageSegmentId !== null) return pageTracks({ segment: pageSegment, matched: pageMatched });
    if (onTab) return tabTracks(tabSegments);
    return OFF;
  }, [pageSegmentId, pageSegment, pageMatched, onTab, tabSegments]);
};
