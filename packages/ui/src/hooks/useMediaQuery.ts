import { useCallback, useMemo, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

export const useMediaQuery = (query: string): boolean => {
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
