import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ChartHoverX = number | string;

interface ChartHoverState {
  hoveredX: Record<string, ChartHoverX | null>;
  setChartHover: (group: string, x: ChartHoverX) => void;
  clearChartHover: (group: string) => void;
}

export const useChartHoverStore = create<ChartHoverState>()(
  immer((set) => ({
    hoveredX: {},
    setChartHover: (group, x) =>
      set((draft) => {
        draft.hoveredX[group] = x;
      }),
    clearChartHover: (group) =>
      set((draft) => {
        draft.hoveredX[group] = null;
      }),
  })),
);

export const useChartHoverX = (group: string): ChartHoverX | null =>
  useChartHoverStore((s) => s.hoveredX[group] ?? null);
