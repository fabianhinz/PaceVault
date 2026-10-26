import { DESKTOP_MEDIA_QUERY, FINE_POINTER_QUERY } from '../lib/mediaQueries.ts';
import { useMediaQuery } from './useMediaQuery.ts';

interface Device {
  desktop: boolean;
  pointerFine: boolean;
}

export const useDevice = (): Device => ({
  desktop: useMediaQuery(DESKTOP_MEDIA_QUERY),
  pointerFine: useMediaQuery(FINE_POINTER_QUERY),
});
