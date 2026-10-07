import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ColorMode } from '@/lib/colorModes.ts';
import type { LapSet, LapSource } from '@/lib/lapSet.ts';

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
  trackColorMode: ColorMode;
  setTrackColorMode: (mode: ColorMode) => void;
  sessionColorMode: ColorMode;
  setSessionColorMode: (mode: ColorMode) => void;
  lapSource: LapSource;
  setLapSource: (source: LapSource) => void;
  splitDistance: number | null;
  setSplitDistance: (metres: number) => void;
  sessionLaps: LapSet | null;
  setSessionLaps: (laps: LapSet | null) => void;
  selectedLapIndex: number | null;
  selectLap: (lapIndex: number) => void;
  toggleSelectedLap: (lapIndex: number) => void;
  clearSelectedLap: () => void;
  hoveredLapIndex: number | null;
  setHoveredLap: (lapIndex: number | null) => void;
}

export const useMapFocusStore = create<MapFocusState>()(
  immer((set, get) => ({
    openedSessionId: null,
    setOpenedSession: (id) => {
      if (id === null) {
        set({
          openedSessionId: null,
          hoveredPoint: null,
          trackColorMode: 'sport',
          sessionColorMode: 'sport',
          lapSource: 'splits',
          splitDistance: null,
          sessionLaps: null,
          selectedLapIndex: null,
          hoveredLapIndex: null,
        });
      } else if (id !== get().openedSessionId) {
        set({
          openedSessionId: id,
          sessionColorMode: 'sport',
          lapSource: 'splits',
          splitDistance: null,
          selectedLapIndex: null,
          hoveredLapIndex: null,
        });
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
    trackColorMode: 'sport',
    setTrackColorMode: (mode) => set({ trackColorMode: mode }),
    sessionColorMode: 'sport',
    setSessionColorMode: (mode) => set({ sessionColorMode: mode }),
    lapSource: 'splits',
    setLapSource: (source) =>
      set({ lapSource: source, selectedLapIndex: null, hoveredLapIndex: null }),
    splitDistance: null,
    setSplitDistance: (metres) =>
      set({
        lapSource: 'splits',
        splitDistance: metres,
        selectedLapIndex: null,
        hoveredLapIndex: null,
      }),
    sessionLaps: null,
    setSessionLaps: (laps) => set({ sessionLaps: laps }),
    selectedLapIndex: null,
    selectLap: (lapIndex) => set({ selectedLapIndex: lapIndex }),
    toggleSelectedLap: (lapIndex) => {
      if (get().selectedLapIndex === lapIndex) {
        set({ selectedLapIndex: null });
      } else {
        set({ selectedLapIndex: lapIndex });
      }
    },
    clearSelectedLap: () => set({ selectedLapIndex: null }),
    hoveredLapIndex: null,
    setHoveredLap: (lapIndex) => {
      if (get().hoveredLapIndex !== lapIndex) set({ hoveredLapIndex: lapIndex });
    },
  })),
);
