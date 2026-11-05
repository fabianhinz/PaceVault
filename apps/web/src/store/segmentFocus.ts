import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type MapMarker = [number, number];

interface SegmentFocusState {
  passMarker: MapMarker | null;
  bestMarker: MapMarker | null;
  showExplorerMarkers: (markers: { pass: MapMarker | null; best: MapMarker | null }) => void;
  clearPassFocus: () => void;
}

export const INITIAL_SEGMENT_FOCUS_STORE_STATE: Pick<
  SegmentFocusState,
  'passMarker' | 'bestMarker'
> = {
  passMarker: null,
  bestMarker: null,
};

export const useSegmentFocusStore = create<SegmentFocusState>()(
  immer((set) => ({
    ...INITIAL_SEGMENT_FOCUS_STORE_STATE,
    showExplorerMarkers: (markers) =>
      set((draft) => {
        draft.passMarker = markers.pass;
        draft.bestMarker = markers.best;
      }),
    clearPassFocus: () =>
      set((draft) => {
        draft.passMarker = null;
        draft.bestMarker = null;
      }),
  })),
);
