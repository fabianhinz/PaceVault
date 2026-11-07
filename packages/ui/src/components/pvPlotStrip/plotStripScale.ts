const PLOT_TOP_PX = 6;
const PLOT_SPAN_PX = 28;

export const plotStripTopPx = (ratio: number): number => PLOT_TOP_PX + ratio * PLOT_SPAN_PX;
