import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SessionLap, SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import type { LapMarker } from '@/lib/lapMarkers.ts';
import type { ZoneColorMode } from '@/features/map/zoneColoredPath.ts';

interface MapFocusState {
  openedSessionId: string | null;
  setOpenedSession: (id: string | null) => void;
  hoveredSessionId: string | null;
  setHoveredSession: (id: string | null) => void;
  focusedTripSessionIds: string[];
  setFocusedTripSessions: (ids: string[]) => void;
  focusedLaps: SessionLap[];
  focusedSport: Sport | null;
  focusedRecords: SessionRecord[];
  setFocusedLaps: (laps: SessionLap[], sport: Sport, records: SessionRecord[]) => void;
  clearFocusedLaps: () => void;
  activeLapAnalysis: LapAnalysis[];
  activeLapEnrichments: LapRecordEnrichment[];
  activeSplitDistance: number | null;
  setActiveLapData: (
    analysis: LapAnalysis[],
    enrichments: LapRecordEnrichment[],
    splitDistance: number | null,
  ) => void;
  clickedLapIndex: number | null;
  setClickedLapIndex: (index: number) => void;
  clearClickedLapIndex: () => void;
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
          focusedLaps: [],
          focusedSport: null,
          focusedRecords: [],
          hoveredPoint: null,
          lapMarkers: [],
          hoveredLapIndex: null,
          activeLapAnalysis: [],
          activeLapEnrichments: [],
          activeSplitDistance: null,
          clickedLapIndex: null,
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
    focusedLaps: [],
    focusedSport: null,
    focusedRecords: [],
    setFocusedLaps: (laps, sport, records) =>
      set({ focusedLaps: laps, focusedSport: sport, focusedRecords: records }),
    clearFocusedLaps: () =>
      set({
        focusedLaps: [],
        focusedSport: null,
        focusedRecords: [],
        activeLapAnalysis: [],
        activeLapEnrichments: [],
        activeSplitDistance: null,
        clickedLapIndex: null,
      }),
    activeLapAnalysis: [],
    activeLapEnrichments: [],
    activeSplitDistance: null,
    setActiveLapData: (analysis, enrichments, splitDistance) =>
      set({
        activeLapAnalysis: analysis,
        activeLapEnrichments: enrichments,
        activeSplitDistance: splitDistance,
      }),
    clickedLapIndex: null,
    setClickedLapIndex: (index) => set({ clickedLapIndex: index }),
    clearClickedLapIndex: () => set({ clickedLapIndex: null }),
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
