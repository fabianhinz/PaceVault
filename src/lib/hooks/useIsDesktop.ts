import { useMediaQuery } from './useMediaQuery';

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export const useIsDesktop = () => useMediaQuery(DESKTOP_MEDIA_QUERY);
