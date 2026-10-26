import { useEffect, useState } from 'react';
import { MIN_OPEN_MS } from './useHeldReprocess.ts';

export const useMinOpenTimeReached = (openedAt: number): boolean => {
  const [minTimeReached, setMinTimeReached] = useState(false);

  useEffect(() => {
    const remaining = Math.max(0, openedAt + MIN_OPEN_MS - Date.now());
    const timeout = setTimeout(() => setMinTimeReached(true), remaining);
    return () => clearTimeout(timeout);
  }, [openedAt]);

  return minTimeReached;
};
