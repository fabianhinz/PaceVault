import { useLayoutStore } from '@/store/layout.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { readSafeAreaInset, readSheetLayout, sheetFitHeight } from '@/lib/sheetPosition.ts';
import { DESKTOP_MEDIA_QUERY } from '@/lib/hooks/useIsDesktop.ts';
import { SHEET_ABOVE_GAP } from '@/components/ui/sheetAboveContext.ts';

interface MapPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const MAP_FIT_MARGIN = 80;
export const MAP_CONTROLS_HEIGHT = 38;
export const MAP_CONTROLS_BOTTOM = 40;

const hasMapControls = (): boolean => useMapFocusStore.getState().openedSessionId !== null;

const desktopInsets = (): MapPadding => {
  const insets: MapPadding = {
    top: readSafeAreaInset('top'),
    bottom: 0,
    left: 0,
    right: 0,
  };
  if (!useLayoutStore.getState().onboardingComplete) return insets;
  const dock = document.querySelector<HTMLElement>('[data-layout="dock"]');
  if (dock) {
    insets.left = dock.getBoundingClientRect().right;
  }
  const main = document.querySelector<HTMLElement>('[data-layout="main"]');
  if (main) {
    insets.right = Math.max(0, window.innerWidth - main.getBoundingClientRect().left);
  }
  if (hasMapControls()) {
    insets.bottom = MAP_CONTROLS_BOTTOM + MAP_CONTROLS_HEIGHT;
  }
  return insets;
};

const phoneInsets = (): MapPadding => {
  let covered = sheetFitHeight(readSheetLayout(), useLayoutStore.getState().mobileSheetPosition);
  if (hasMapControls()) {
    covered += SHEET_ABOVE_GAP + MAP_CONTROLS_HEIGHT;
  }
  return {
    top: readSafeAreaInset('top'),
    bottom: covered,
    left: 0,
    right: 0,
  };
};

const layoutInsets = (): MapPadding => {
  if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return desktopInsets();
  return phoneInsets();
};

export const mapPadding = (margin: number): MapPadding => {
  const insets = layoutInsets();
  return {
    top: insets.top + margin,
    bottom: insets.bottom + margin,
    left: insets.left + margin,
    right: insets.right + margin,
  };
};
