import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ColorMode } from '@/lib/colorModes.ts';
import type { LapSet, LapSource } from '@/lib/lapSet.ts';

export type TrackIntensity = 'faint' | 'warm' | 'hot';

interface MapControlsState {
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
  lapCloseCount: number;
  closeSelectedLap: () => void;
  hoveredLapIndex: number | null;
  setHoveredLap: (lapIndex: number | null) => void;
  trackIntensity: TrackIntensity;
  setTrackIntensity: (intensity: TrackIntensity) => void;
  overviewMapControlsShown: boolean;
  setOverviewMapControlsShown: (shown: boolean) => void;
  resetSessionControlsOnSessionOpen: () => void;
  resetSessionControlsOnSessionClose: () => void;
}

export const useMapControlsStore = create<MapControlsState>()(
  immer((set, get) => ({
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
    trackIntensity: 'warm',
    setTrackIntensity: (intensity) => set({ trackIntensity: intensity }),
    overviewMapControlsShown: false,
    setOverviewMapControlsShown: (shown) => set({ overviewMapControlsShown: shown }),
    resetSessionControlsOnSessionOpen: () =>
      set({
        sessionColorMode: 'sport',
        lapSource: 'splits',
        splitDistance: null,
        selectedLapIndex: null,
        hoveredLapIndex: null,
      }),
    resetSessionControlsOnSessionClose: () =>
      set({
        trackColorMode: 'sport',
        sessionColorMode: 'sport',
        lapSource: 'splits',
        splitDistance: null,
        sessionLaps: null,
        selectedLapIndex: null,
        hoveredLapIndex: null,
      }),
  })),
);
