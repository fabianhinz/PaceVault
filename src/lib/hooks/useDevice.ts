import { useMediaQuery } from './useMediaQuery';

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

export const useDevice = () => ({
  isDesktop: useMediaQuery(DESKTOP_MEDIA_QUERY),
  pointerFine: useMediaQuery(FINE_POINTER_QUERY),
});
