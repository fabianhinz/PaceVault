import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ColorMode } from '@/lib/colorModes.ts';
import type { LapSet } from '@/lib/lapSet.ts';

export const MAP_VIEWS = ['2d', '3d'] as const;

export type MapView = (typeof MAP_VIEWS)[number];

interface MapControlsState {
  trackColorMode: ColorMode;
  setTrackColorMode: (mode: ColorMode) => void;
  sessionLaps: LapSet | null;
  setSessionLaps: (laps: LapSet | null) => void;
  selectedLapIndex: number | null;
  selectLap: (lapIndex: number) => void;
  toggleSelectedLap: (lapIndex: number) => void;
  clearSelectedLap: () => void;
  lapCloseCount: number;
  closeSelectedLap: () => void;
  hoveredLapIndex: number | null;
  setHoveredLap: (lapIndex: number | null) => void;
  clearLapFocusOnLapSetChange: () => void;
  overviewMapControlsShown: boolean;
  setOverviewMapControlsShown: (shown: boolean) => void;
  sessionMapView: MapView;
  setSessionMapView: (view: MapView) => void;
  terrainTrackHovered: boolean;
  setTerrainTrackHovered: (hovered: boolean) => void;
  resetSessionControlsOnSessionOpen: () => void;
  resetSessionControlsOnSessionClose: () => void;
}

export const useMapControlsStore = create<MapControlsState>()(
  immer((set, get) => ({
    trackColorMode: 'sport',
    setTrackColorMode: (mode) => set({ trackColorMode: mode }),
    sessionLaps: null,
    setSessionLaps: (laps) => set({ sessionLaps: laps }),
    selectedLapIndex: null,
    selectLap: (lapIndex) => set({ selectedLapIndex: lapIndex }),
    toggleSelectedLap: (lapIndex) => {
      if (get().selectedLapIndex === lapIndex) {
        set({ selectedLapIndex: null, lapCloseCount: get().lapCloseCount + 1 });
      } else {
        set({ selectedLapIndex: lapIndex });
      }
    },
    clearSelectedLap: () => set({ selectedLapIndex: null }),
    lapCloseCount: 0,
    closeSelectedLap: () => {
      if (get().selectedLapIndex === null) return;
      set({ selectedLapIndex: null, lapCloseCount: get().lapCloseCount + 1 });
    },
    hoveredLapIndex: null,
    setHoveredLap: (lapIndex) => {
      if (get().hoveredLapIndex !== lapIndex) set({ hoveredLapIndex: lapIndex });
    },
    clearLapFocusOnLapSetChange: () => set({ selectedLapIndex: null, hoveredLapIndex: null }),
    overviewMapControlsShown: false,
    setOverviewMapControlsShown: (shown) => set({ overviewMapControlsShown: shown }),
    sessionMapView: '2d',
    setSessionMapView: (view) => set({ sessionMapView: view }),
    terrainTrackHovered: false,
    setTerrainTrackHovered: (hovered) => {
      if (get().terrainTrackHovered !== hovered) set({ terrainTrackHovered: hovered });
    },
    resetSessionControlsOnSessionOpen: () =>
      set({
        selectedLapIndex: null,
        hoveredLapIndex: null,
        sessionMapView: '2d',
        terrainTrackHovered: false,
      }),
    resetSessionControlsOnSessionClose: () =>
      set({
        trackColorMode: 'sport',
        sessionLaps: null,
        selectedLapIndex: null,
        hoveredLapIndex: null,
        sessionMapView: '2d',
        terrainTrackHovered: false,
      }),
  })),
);
