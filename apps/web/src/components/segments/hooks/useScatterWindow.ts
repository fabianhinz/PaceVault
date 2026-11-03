import { useRef, useState } from 'react';
import { useUnmount } from 'react-use';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { latestWindowSessionIds } from '@/components/segments/segmentPasses.ts';

const SCROLL_SETTLE_MS = 150;

export interface ScatterWindow {
  windowSessionIds: Set<string> | null;
  reportVisible: (sessionIds: Set<string> | null) => void;
}

export const useScatterWindow = (segment: Segment): ScatterWindow => {
  const [windowSessionIds, setWindowSessionIds] = useState(() => latestWindowSessionIds(segment));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useUnmount(() => clearTimeout(timer.current));

  return {
    windowSessionIds,
    reportVisible: (sessionIds) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWindowSessionIds(sessionIds), SCROLL_SETTLE_MS);
    },
  };
};
