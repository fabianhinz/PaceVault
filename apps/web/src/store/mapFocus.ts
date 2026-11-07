import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RecordSpan } from '@/lib/analysis/laps.ts';

export type MapHoverTarget =
  | { kind: 'session'; id: string }
  | { kind: 'studioRoute'; id: string }
  | { kind: 'segment'; id: string }
  | { kind: 'segmentSpan'; id: string; span: RecordSpan };

export type MapHoverKind = MapHoverTarget['kind'];

export interface MapHover {
  target: MapHoverTarget;
  sceneKey: string;
}

interface MapFocusState {
  mapHover: MapHover | null;
  setMapHover: (hover: MapHover) => void;
  clearMapHover: (target: { kind: MapHoverKind; id: string }) => void;
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
  'mapHover' | 'hoveredPoint' | 'pickCircle' | 'mapRefitRequest'
> = {
  mapHover: null,
  hoveredPoint: null,
  pickCircle: null,
  mapRefitRequest: 0,
};

export const useMapFocusStore = create<MapFocusState>()(
  immer((set, get) => ({
    ...INITIAL_MAP_FOCUS_STORE_STATE,
    setMapHover: (hover) => set({ mapHover: hover }),
    clearMapHover: (target) => {
      const current = get().mapHover?.target;
      if (current?.kind !== target.kind || current.id !== target.id) return;
      set({ mapHover: null });
    },
    setHoveredPoint: (point) => set({ hoveredPoint: point }),
    clearHoveredPoint: () => set({ hoveredPoint: null }),
    setPickCircle: (center) => set({ pickCircle: center }),
    clearPickCircle: () => set({ pickCircle: null }),
    requestMapRefitAfterDelete: () => set({ mapRefitRequest: get().mapRefitRequest + 1 }),
  })),
);
