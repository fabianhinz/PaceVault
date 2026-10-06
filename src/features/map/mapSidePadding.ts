import { useLayoutStore } from '@/store/layout.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { readSheetLayout, sheetVisibleHeight } from '@/lib/sheetPosition.ts';

interface SidePadding {
  right: number;
  bottom: number;
}

const MIN_MAP_VISIBLE = 240;

const COLOR_BY_PILL_CLEARANCE = 64;

const LAP_PEEK_CLEARANCE = 48;

const pillClearance = (isDesktop: boolean): number => {
  const state = useMapFocusStore.getState();
  if (state.openedSessionId === null) return 0;
  if (isDesktop && state.selectedLapIndex !== null) {
    return COLOR_BY_PILL_CLEARANCE + LAP_PEEK_CLEARANCE;
  }
  return COLOR_BY_PILL_CLEARANCE;
};

export const mapSidePadding = (): SidePadding => {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return { right: window.innerWidth * 0.4, bottom: pillClearance(true) };
  }
  const visible = sheetVisibleHeight(
    readSheetLayout(),
    useLayoutStore.getState().mobileSheetPosition,
  );
  return {
    right: 0,
    bottom: Math.min(visible + pillClearance(false), window.innerHeight - MIN_MAP_VISIBLE),
  };
};
