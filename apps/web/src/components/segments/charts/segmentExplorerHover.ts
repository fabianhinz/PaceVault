import { useChartHoverStore } from '@/store/chartHover.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { positionAtElapsed, type PassSeries } from './segmentChartRows.ts';

export const SEGMENT_HOVER_GROUP = 'segment-detail';
export const SECONDS_PER_MINUTE = 60;

export const hoverSegmentExplorer = ({
  elapsedSec,
  selected,
  best,
}: {
  elapsedSec: number | null;
  selected: PassSeries;
  best: PassSeries | undefined;
}): void => {
  if (elapsedSec === null) {
    useChartHoverStore.getState().clearChartHover(SEGMENT_HOVER_GROUP);
    useSegmentFocusStore.getState().clearPassFocus();
    return;
  }
  useChartHoverStore.getState().setChartHover({ group: SEGMENT_HOVER_GROUP, x: elapsedSec });
  let bestMarker: [number, number] | null = null;
  if (best !== undefined) bestMarker = positionAtElapsed({ series: best, elapsedSec });
  useSegmentFocusStore.getState().showExplorerMarkers({
    pass: positionAtElapsed({ series: selected, elapsedSec }),
    best: bestMarker,
  });
};
