import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ColorMode } from '@/lib/colors/colorModes.ts';
import type { LapSet, RecordSpan } from '@/lib/analysis/laps.ts';

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
  hoveredSegmentSpan: RecordSpan | null;
  setHoveredSegmentSpan: (span: RecordSpan | null) => void;
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

export const INITIAL_MAP_CONTROLS_STORE_STATE: Pick<
  MapControlsState,
  | 'trackColorMode'
  | 'sessionLaps'
  | 'selectedLapIndex'
  | 'hoveredSegmentSpan'
  | 'lapCloseCount'
  | 'hoveredLapIndex'
  | 'overviewMapControlsShown'
  | 'sessionMapView'
  | 'terrainTrackHovered'
> = {
  trackColorMode: 'sport',
  sessionLaps: null,
  selectedLapIndex: null,
  hoveredSegmentSpan: null,
  lapCloseCount: 0,
  hoveredLapIndex: null,
  overviewMapControlsShown: false,
  sessionMapView: '2d',
  terrainTrackHovered: false,
};

export const useMapControlsStore = create<MapControlsState>()(
  immer((set, get) => ({
    ...INITIAL_MAP_CONTROLS_STORE_STATE,
    setTrackColorMode: (mode) => set({ trackColorMode: mode }),
    setSessionLaps: (laps) => set({ sessionLaps: laps }),
    selectLap: (lapIndex) => set({ selectedLapIndex: lapIndex }),
    toggleSelectedLap: (lapIndex) => {
      if (get().selectedLapIndex === lapIndex) {
        set({ selectedLapIndex: null, lapCloseCount: get().lapCloseCount + 1 });
      } else {
        set({ selectedLapIndex: lapIndex });
      }
    },
    clearSelectedLap: () => set({ selectedLapIndex: null }),
    setHoveredSegmentSpan: (span) => {
      if (get().hoveredSegmentSpan !== span) set({ hoveredSegmentSpan: span });
    },
    closeSelectedLap: () => {
      if (get().selectedLapIndex === null) return;
      set({ selectedLapIndex: null, lapCloseCount: get().lapCloseCount + 1 });
    },
    setHoveredLap: (lapIndex) => {
      if (get().hoveredLapIndex !== lapIndex) set({ hoveredLapIndex: lapIndex });
    },
    clearLapFocusOnLapSetChange: () => set({ selectedLapIndex: null, hoveredLapIndex: null }),
    setOverviewMapControlsShown: (shown) => set({ overviewMapControlsShown: shown }),
    setSessionMapView: (view) => set({ sessionMapView: view }),
    setTerrainTrackHovered: (hovered) => {
      if (get().terrainTrackHovered !== hovered) set({ terrainTrackHovered: hovered });
    },
    resetSessionControlsOnSessionOpen: () =>
      set({
        selectedLapIndex: null,
        hoveredSegmentSpan: null,
        hoveredLapIndex: null,
        sessionMapView: '2d',
        terrainTrackHovered: false,
      }),
    resetSessionControlsOnSessionClose: () =>
      set({
        trackColorMode: 'sport',
        sessionLaps: null,
        selectedLapIndex: null,
        hoveredSegmentSpan: null,
        hoveredLapIndex: null,
        sessionMapView: '2d',
        terrainTrackHovered: false,
      }),
  })),
);
