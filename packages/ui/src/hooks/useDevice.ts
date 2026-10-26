import { useMediaQuery } from './useMediaQuery.ts';

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

interface Device {
  desktop: boolean;
  pointerFine: boolean;
}

export const useDevice = (): Device => ({
  desktop: useMediaQuery(DESKTOP_MEDIA_QUERY),
  pointerFine: useMediaQuery(FINE_POINTER_QUERY),
});
