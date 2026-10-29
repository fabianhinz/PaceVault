import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useMapControlsStore } from '@/store/mapControls.ts';

interface MapFocusState {
  openedSessionId: string | null;
  setOpenedSession: (id: string | null) => void;
  hoveredSessionId: string | null;
  setHoveredSession: (id: string | null) => void;
  focusedTripSessionIds: string[];
  setFocusedTripSessions: (ids: string[]) => void;
  hoveredStudioRouteId: string | null;
  setHoveredStudioRoute: (id: string | null) => void;
  hoveredPoint: [number, number] | null;
  setHoveredPoint: (point: [number, number]) => void;
  clearHoveredPoint: () => void;
  pickCircle: [number, number] | null;
  setPickCircle: (center: [number, number]) => void;
  clearPickCircle: () => void;
  mapRefitRequest: number;
  requestMapRefitAfterDelete: () => void;
}

export const INITIAL_MAP_FOCUS_STORE_STATE: Pick<
  MapFocusState,
  | 'openedSessionId'
  | 'hoveredSessionId'
  | 'focusedTripSessionIds'
  | 'hoveredStudioRouteId'
  | 'hoveredPoint'
  | 'pickCircle'
  | 'mapRefitRequest'
> = {
  openedSessionId: null,
  hoveredSessionId: null,
  focusedTripSessionIds: [],
  hoveredStudioRouteId: null,
  hoveredPoint: null,
  pickCircle: null,
  mapRefitRequest: 0,
};

export const useMapFocusStore = create<MapFocusState>()(
  immer((set, get) => ({
    ...INITIAL_MAP_FOCUS_STORE_STATE,
    setOpenedSession: (id) => {
      if (id === null) {
        useMapControlsStore.getState().resetSessionControlsOnSessionClose();
        set({ openedSessionId: null, hoveredPoint: null });
      } else if (id !== get().openedSessionId) {
        useMapControlsStore.getState().resetSessionControlsOnSessionOpen();
        set({ openedSessionId: id });
      }
    },
    setHoveredSession: (id) => set({ hoveredSessionId: id }),
    setFocusedTripSessions: (ids) => set({ focusedTripSessionIds: ids }),
    setHoveredStudioRoute: (id) => set({ hoveredStudioRouteId: id }),
    setHoveredPoint: (point) => set({ hoveredPoint: point }),
    clearHoveredPoint: () => set({ hoveredPoint: null }),
    setPickCircle: (center) => set({ pickCircle: center }),
    clearPickCircle: () => set({ pickCircle: null }),
    requestMapRefitAfterDelete: () => set({ mapRefitRequest: get().mapRefitRequest + 1 }),
  })),
);
