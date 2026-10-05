import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Sport } from '@/packages/engine/types.ts';
import type { LapMarker } from '@/lib/lapMarkers.ts';
import type { ZoneColorMode } from '@/features/map/zoneColoredPath.ts';

interface MapFocusState {
  openedSessionId: string | null;
  setOpenedSession: (id: string | null) => void;
  hoveredSessionId: string | null;
  setHoveredSession: (id: string | null) => void;
  focusedTripSessionIds: string[];
  setFocusedTripSessions: (ids: string[]) => void;
  hoveredStudioRouteId: string | null;
  setHoveredStudioRoute: (id: string | null) => void;
  focusedSport: Sport | null;
  setFocusedSport: (sport: Sport) => void;
  clearFocusedSport: () => void;
  hoveredPoint: [number, number] | null;
  setHoveredPoint: (point: [number, number]) => void;
  clearHoveredPoint: () => void;
  pickCircle: [number, number] | null;
  setPickCircle: (center: [number, number]) => void;
  clearPickCircle: () => void;
  lapMarkers: LapMarker[];
  setLapMarkers: (markers: LapMarker[]) => void;
  clearLapMarkers: () => void;
  hoveredLapIndex: number | null;
  setHoveredLapIndex: (index: number) => void;
  clearHoveredLapIndex: () => void;
  zoneColorMode: ZoneColorMode | null;
  setZoneColorMode: (mode: ZoneColorMode | null) => void;
}

export const useMapFocusStore = create<MapFocusState>()(
  immer((set) => ({
    openedSessionId: null,
    setOpenedSession: (id) => {
      if (id === null) {
        set({
          openedSessionId: null,
          focusedSport: null,
          hoveredPoint: null,
          lapMarkers: [],
          hoveredLapIndex: null,
          zoneColorMode: null,
        });
      } else {
        set({ openedSessionId: id });
      }
    },
    hoveredSessionId: null,
    setHoveredSession: (id) => set({ hoveredSessionId: id }),
    focusedTripSessionIds: [],
    setFocusedTripSessions: (ids) => set({ focusedTripSessionIds: ids }),
    hoveredStudioRouteId: null,
    setHoveredStudioRoute: (id) => set({ hoveredStudioRouteId: id }),
    focusedSport: null,
    setFocusedSport: (sport) => set({ focusedSport: sport }),
    clearFocusedSport: () => set({ focusedSport: null }),
    hoveredPoint: null,
    setHoveredPoint: (point) => set({ hoveredPoint: point }),
    clearHoveredPoint: () => set({ hoveredPoint: null }),
    pickCircle: null,
    setPickCircle: (center) => set({ pickCircle: center }),
    clearPickCircle: () => set({ pickCircle: null }),
    lapMarkers: [],
    setLapMarkers: (markers) => set({ lapMarkers: markers }),
    clearLapMarkers: () => set({ lapMarkers: [] }),
    hoveredLapIndex: null,
    setHoveredLapIndex: (index) => set({ hoveredLapIndex: index }),
    clearHoveredLapIndex: () => set({ hoveredLapIndex: null }),
    zoneColorMode: null,
    setZoneColorMode: (mode) => set({ zoneColorMode: mode }),
  })),
);
