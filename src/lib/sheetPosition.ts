import { dockFootprint } from './dockGeometry.ts';

interface SheetMetrics {
  viewportHeight: number;
  safeTop: number;
  safeBottom: number;
}

interface SheetLayout {
  sheetHeight: number;
  bottomInset: number;
  peekOffset: number;
  handleHeight: number;
  peekContentHeight: number;
}

const HANDLE_HEIGHT = 48;
const PEEK_CONTENT_HEIGHT = 66;
const PEEK_HEIGHT = HANDLE_HEIGHT + PEEK_CONTENT_HEIGHT;
const PEEK_FADE_RANGE = 0.15;
const FULL_TOP_GAP_RATIO = 0.08;
const FULL_TOP_GAP_MIN = 12;
const MIDDLE_POSITION = 0.5;

export const computeSheetLayout = (metrics: SheetMetrics): SheetLayout => {
  const topGap = Math.max(
    metrics.safeTop + FULL_TOP_GAP_MIN,
    metrics.viewportHeight * FULL_TOP_GAP_RATIO,
  );
  const sheetHeight = metrics.viewportHeight - topGap;
  const bottomInset = dockFootprint(metrics.safeBottom);
  const peekOffset = Math.max(0, sheetHeight - PEEK_HEIGHT - bottomInset);
  return {
    sheetHeight,
    bottomInset,
    peekOffset,
    handleHeight: HANDLE_HEIGHT,
    peekContentHeight: PEEK_CONTENT_HEIGHT,
  };
};

const clampPosition = (position: number): number => Math.min(1, Math.max(0, position));

export const positionToOffset = (layout: SheetLayout, position: number): number =>
  (1 - clampPosition(position)) * layout.peekOffset;

export const offsetToPosition = (layout: SheetLayout, offset: number): number => {
  if (layout.peekOffset === 0) {
    return 1;
  }
  return clampPosition(1 - offset / layout.peekOffset);
};

export const peekFadeOffsets = (layout: SheetLayout): [number, number] => [
  layout.peekOffset * (1 - PEEK_FADE_RANGE),
  layout.peekOffset,
];

export const settlePosition = (position: number): number => {
  if (position <= 0 || position >= PEEK_FADE_RANGE) {
    return position;
  }
  const summaryOpacity = 1 - position / PEEK_FADE_RANGE;
  if (summaryOpacity > 0.5) {
    return 0;
  }
  return PEEK_FADE_RANGE;
};

export const sheetTapTarget = (position: number): number => {
  if (position <= 0.5) {
    return 1;
  }
  return 0;
};

const sheetVisibleHeight = (layout: SheetLayout, position: number): number =>
  layout.sheetHeight - positionToOffset(layout, position);

export const sheetFitHeight = (
  layout: SheetLayout,
  position: number,
  cap: number = MIDDLE_POSITION,
): number => sheetVisibleHeight(layout, Math.min(position, cap));

export const readSafeAreaInset = (side: 'top' | 'bottom'): number => {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.paddingTop = `env(safe-area-inset-${side})`;
  document.body.append(probe);
  const inset = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return inset;
};

export const readSheetLayout = (): SheetLayout =>
  computeSheetLayout({
    viewportHeight: window.innerHeight,
    safeTop: readSafeAreaInset('top'),
    safeBottom: readSafeAreaInset('bottom'),
  });
