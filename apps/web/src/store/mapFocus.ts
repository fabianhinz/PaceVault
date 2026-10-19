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

export const useMapFocusStore = create<MapFocusState>()(
  immer((set, get) => ({
    openedSessionId: null,
    setOpenedSession: (id) => {
      if (id === null) {
        useMapControlsStore.getState().resetSessionControlsOnSessionClose();
        set({ openedSessionId: null, hoveredPoint: null });
      } else if (id !== get().openedSessionId) {
        useMapControlsStore.getState().resetSessionControlsOnSessionOpen();
        set({ openedSessionId: id });
      }
    },
    hoveredSessionId: null,
    setHoveredSession: (id) => set({ hoveredSessionId: id }),
    focusedTripSessionIds: [],
    setFocusedTripSessions: (ids) => set({ focusedTripSessionIds: ids }),
    hoveredStudioRouteId: null,
    setHoveredStudioRoute: (id) => set({ hoveredStudioRouteId: id }),
    hoveredPoint: null,
    setHoveredPoint: (point) => set({ hoveredPoint: point }),
    clearHoveredPoint: () => set({ hoveredPoint: null }),
    pickCircle: null,
    setPickCircle: (center) => set({ pickCircle: center }),
    clearPickCircle: () => set({ pickCircle: null }),
    mapRefitRequest: 0,
    requestMapRefitAfterDelete: () => set({ mapRefitRequest: get().mapRefitRequest + 1 }),
  })),
);
