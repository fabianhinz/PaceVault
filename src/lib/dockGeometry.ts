export const DOCK_ROW_HEIGHT = 52;
export const DOCK_STACK_GAP = 8;
const DOCK_EDGE_INSET = 12;
const DOCK_SAFE_AREA_OVERLAP = 6;

export const DOCK_ROW_BOTTOM_CSS = `max(${DOCK_EDGE_INSET}px, calc(env(safe-area-inset-bottom) - ${DOCK_SAFE_AREA_OVERLAP}px))`;

export const dockFootprint = (safeBottom: number): number =>
  Math.max(DOCK_EDGE_INSET, safeBottom - DOCK_SAFE_AREA_OVERLAP) + DOCK_ROW_HEIGHT + DOCK_STACK_GAP;
