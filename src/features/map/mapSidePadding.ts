import { useLayoutStore } from '@/store/layout.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { readSheetLayout, sheetVisibleHeight } from '@/lib/sheetPosition.ts';

interface SidePadding {
  right: number;
  bottom: number;
}

const MIN_MAP_VISIBLE = 240;

const COLOR_BY_PILL_CLEARANCE = 64;

const pillClearance = (): number => {
  if (useMapFocusStore.getState().openedSessionId === null) return 0;
  return COLOR_BY_PILL_CLEARANCE;
};

export const mapSidePadding = (): SidePadding => {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return { right: window.innerWidth * 0.4, bottom: pillClearance() };
  }
  const visible = sheetVisibleHeight(
    readSheetLayout(),
    useLayoutStore.getState().mobileSheetPosition,
  );
  return {
    right: 0,
    bottom: Math.min(visible + pillClearance(), window.innerHeight - MIN_MAP_VISIBLE),
  };
};
