import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { hoverSegmentExplorer } from '@/components/segments/charts/segmentExplorerHover.ts';
import { INITIAL_SEGMENT_FOCUS_STORE_STATE, useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { createMockPassSeries } from '@tests/factories/segments.ts';

describe(hoverSegmentExplorer.name, () => {
  beforeEach(() => {
    useSegmentFocusStore.setState(INITIAL_SEGMENT_FOCUS_STORE_STATE);
  });

  it('shows the selected and the best marker while two passes are plotted', () => {
    hoverSegmentExplorer({
      elapsedSec: 5,
      selected: createMockPassSeries({
        positions: [
          [48.1, 11.5],
          [48.1, 11.5],
        ],
      }),
      best: createMockPassSeries({
        positions: [
          [48.2, 11.6],
          [48.2, 11.6],
        ],
      }),
    });

    expect(useSegmentFocusStore.getState().passMarker).toEqual([48.1, 11.5]);
    expect(useSegmentFocusStore.getState().bestMarker).toEqual([48.2, 11.6]);
  });

  it('shows only the best marker when only the best is plotted (nothing selected)', () => {
    hoverSegmentExplorer({
      elapsedSec: 5,
      selected: createMockPassSeries({
        positions: [
          [48.2, 11.6],
          [48.2, 11.6],
        ],
      }),
      best: undefined,
    });

    expect(useSegmentFocusStore.getState().passMarker).toBe(null);
    expect(useSegmentFocusStore.getState().bestMarker).toEqual([48.2, 11.6]);
  });
});
