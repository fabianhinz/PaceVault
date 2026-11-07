import { useChartHoverStore } from '@/store/chartHover.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { positionAtMovingSec, type PassSeries } from './segmentChartRows.ts';

export const SEGMENT_HOVER_GROUP = 'segment-detail';

export const hoverSegmentExplorer = ({
  movingSec,
  selected,
  best,
}: {
  movingSec: number | null;
  selected: PassSeries;
  best: PassSeries | undefined;
}): void => {
  if (movingSec === null) {
    useChartHoverStore.getState().clearChartHover(SEGMENT_HOVER_GROUP);
    useSegmentFocusStore.getState().clearExplorerMarkers();
    return;
  }
  useChartHoverStore.getState().setChartHover({ group: SEGMENT_HOVER_GROUP, x: movingSec });
  const selectedPosition = positionAtMovingSec({ series: selected, movingSec });
  if (best === undefined) {
    useSegmentFocusStore.getState().showExplorerMarkers({ pass: null, best: selectedPosition });
    return;
  }
  useSegmentFocusStore.getState().showExplorerMarkers({
    pass: selectedPosition,
    best: positionAtMovingSec({ series: best, movingSec }),
  });
};
