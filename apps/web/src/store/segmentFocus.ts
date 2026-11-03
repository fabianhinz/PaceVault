import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type MapMarker = [number, number];

interface SegmentFocusState {
  hoveredSegmentId: string | null;
  hoveredPassSessionId: string | null;
  passMarker: MapMarker | null;
  bestMarker: MapMarker | null;
  setHoveredSegment: (segmentId: string | null) => void;
  hoverPass: (pass: { sessionId: string; marker: MapMarker | null }) => void;
  showExplorerMarkers: (markers: { pass: MapMarker | null; best: MapMarker | null }) => void;
  clearPassFocus: () => void;
}

export const INITIAL_SEGMENT_FOCUS_STORE_STATE: Pick<
  SegmentFocusState,
  'hoveredSegmentId' | 'hoveredPassSessionId' | 'passMarker' | 'bestMarker'
> = {
  hoveredSegmentId: null,
  hoveredPassSessionId: null,
  passMarker: null,
  bestMarker: null,
};

export const useSegmentFocusStore = create<SegmentFocusState>()(
  immer((set) => ({
    ...INITIAL_SEGMENT_FOCUS_STORE_STATE,
    setHoveredSegment: (segmentId) =>
      set((draft) => {
        draft.hoveredSegmentId = segmentId;
      }),
    hoverPass: (pass) =>
      set((draft) => {
        draft.hoveredPassSessionId = pass.sessionId;
        draft.passMarker = pass.marker;
        draft.bestMarker = null;
      }),
    showExplorerMarkers: (markers) =>
      set((draft) => {
        draft.hoveredPassSessionId = null;
        draft.passMarker = markers.pass;
        draft.bestMarker = markers.best;
      }),
    clearPassFocus: () =>
      set((draft) => {
        draft.hoveredPassSessionId = null;
        draft.passMarker = null;
        draft.bestMarker = null;
      }),
  })),
);
