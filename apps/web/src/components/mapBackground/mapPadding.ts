import { useLayoutStore } from '@/store/layout.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import {
  readSafeAreaInset,
  readSheetLayout,
  sheetFitHeight,
} from '@pacevault/ui/lib/sheetPosition.ts';
import { DESKTOP_MEDIA_QUERY } from '@pacevault/ui/lib/mediaQueries.ts';
import { SHEET_ABOVE_GAP } from '@pacevault/ui/lib/sheetPosition.ts';
import { fitPadding, PHONE_FIT_MARGIN, type MapPadding } from './fitPadding.ts';

export const MAP_FIT_MARGIN = 80;
export const MAP_CONTROLS_HEIGHT = 44;
export const MAP_CONTROLS_BOTTOM = 40;

const hasMapControls = (sessionControls: boolean): boolean =>
  sessionControls || useMapControlsStore.getState().overviewMapControlsShown;

const desktopInsets = (sessionControls: boolean): MapPadding => {
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
  if (hasMapControls(sessionControls)) {
    insets.bottom = MAP_CONTROLS_BOTTOM + MAP_CONTROLS_HEIGHT;
  }
  return insets;
};

const phoneInsets = ({
  sheetCap,
  sessionControls,
}: {
  sheetCap: number | undefined;
  sessionControls: boolean;
}): MapPadding => {
  let covered = sheetFitHeight(readSheetLayout(), useLayoutStore.getState().mobileSheetPosition, {
    cap: sheetCap,
  });
  if (hasMapControls(sessionControls)) {
    covered += SHEET_ABOVE_GAP + MAP_CONTROLS_HEIGHT;
  }
  return {
    top: readSafeAreaInset('top'),
    bottom: covered,
    left: 0,
    right: 0,
  };
};

interface MapPaddingOptions {
  sheetCap?: number;
  sessionControls?: boolean;
}

export const mapPadding = (margin: number, options?: MapPaddingOptions): MapPadding => {
  const canvasHeight = window.innerHeight;
  const sessionControls = options?.sessionControls === true;
  if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
    return fitPadding({ canvasHeight, insets: desktopInsets(sessionControls), margin });
  }
  return fitPadding({
    canvasHeight,
    insets: phoneInsets({ sheetCap: options?.sheetCap, sessionControls }),
    margin: Math.min(margin, PHONE_FIT_MARGIN),
  });
};
