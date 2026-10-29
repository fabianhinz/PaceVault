import { useMemo, useState } from 'react';
import { useTimeoutFn } from 'react-use';
import { MIN_OPEN_MS } from '@/components/importProgress/importOverlayTiming.ts';

export const useMinOpenTimeReached = (openedAt: number): boolean => {
  const [minTimeReached, setMinTimeReached] = useState(false);

  const remaining = useMemo(() => Math.max(0, openedAt + MIN_OPEN_MS - Date.now()), [openedAt]);
  useTimeoutFn(() => setMinTimeReached(true), remaining);

  return minTimeReached;
};
