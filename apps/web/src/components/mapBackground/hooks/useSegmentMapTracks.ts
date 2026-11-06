import { useMemo } from 'react';
import type { GPSBounds, Sport } from '@pacevault/engine/types.ts';
import { decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';
import { useSegmentsStore } from '@/store/segments.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { sceneHoveredId, sceneSegmentId } from '@/components/mapBackground/mapScene.ts';
import { useMapScene } from './useMapScene.ts';

interface SegmentMapTrack {
  sport: Sport;
  path: [number, number][];
}

interface SegmentMapTracks {
  page: SegmentMapTrack | null;
  hovered: SegmentMapTrack | null;
  bounds: GPSBounds | null;
}

const NO_TRACKS: SegmentMapTracks = { page: null, hovered: null, bounds: null };

export const useSegmentMapTracks = (): SegmentMapTracks => {
  const scene = useMapScene();
  const pageSegmentId = sceneSegmentId(scene);
  const hoveredId = useMapFocusStore((s) =>
    sceneHoveredId({ hover: s.mapHover, sceneKey: scene.key, kind: 'segment' }),
  );
  let shownId: string | null = pageSegmentId;
  if (shownId === null && scene.kind === 'segmentTab') shownId = hoveredId;
  const segment = useSegmentsStore((s) => s.segments.find((candidate) => candidate.id === shownId));

  return useMemo(() => {
    if (segment === undefined) return NO_TRACKS;
    const track: SegmentMapTrack = {
      sport: segment.sport,
      path: decodeTrackForRendering(segment.encodedPolyline),
    };
    if (pageSegmentId !== null) return { page: track, hovered: null, bounds: segment.bounds };
    return { page: null, hovered: track, bounds: null };
  }, [segment, pageSegmentId]);
};
