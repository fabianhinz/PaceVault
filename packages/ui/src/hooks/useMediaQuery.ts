import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Without `window` (server rendering) every query reads as not matching.
const getServerSnapshot = () => false;

export const useMediaQuery = (query: string) => {
  const mql = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return window.matchMedia(query);
  }, [query]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (mql === undefined) return () => {};
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [mql],
  );

  const getSnapshot = useCallback(() => {
    if (mql === undefined) return false;
    return mql.matches;
  }, [mql]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
