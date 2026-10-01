import { useLayoutStore } from '@/store/layout.ts';
import { readSheetLayout, sheetVisibleHeight } from '@/lib/sheetPosition.ts';

interface SidePadding {
  right: number;
  bottom: number;
}

const MIN_MAP_VISIBLE = 240;

export const mapSidePadding = (): SidePadding => {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return { right: window.innerWidth * 0.4, bottom: 0 };
  }
  const visible = sheetVisibleHeight(
    readSheetLayout(),
    useLayoutStore.getState().mobileSheetPosition,
  );
  return { right: 0, bottom: Math.min(visible, window.innerHeight - MIN_MAP_VISIBLE) };
};
