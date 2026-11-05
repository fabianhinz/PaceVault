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
  const selectedPosition = positionAtElapsed({ series: selected, elapsedSec });
  if (best === undefined) {
    useSegmentFocusStore.getState().showExplorerMarkers({ pass: null, best: selectedPosition });
    return;
  }
  useSegmentFocusStore.getState().showExplorerMarkers({
    pass: selectedPosition,
    best: positionAtElapsed({ series: best, elapsedSec }),
  });
};
