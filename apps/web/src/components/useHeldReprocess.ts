import { useEffect, useState } from 'react';
import type { ForegroundImport } from '@/store/importProgress.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

export const MIN_OPEN_MS = 1.5 * MS_PER_SECOND;

export const useHeldReprocess = (foreground: ForegroundImport | null): ForegroundImport | null => {
  const [previous, setPrevious] = useState(foreground);
  const [held, setHeld] = useState<ForegroundImport | null>(null);

  if (foreground !== previous) {
    setPrevious(foreground);
    if (foreground === null && previous?.task === 'reprocess') setHeld(previous);
    else setHeld(null);
  }

  useEffect(() => {
    if (held === null) return;
    const remaining = Math.max(0, held.openedAt + MIN_OPEN_MS - Date.now());
    const timeout = setTimeout(() => setHeld(null), remaining);
    return () => clearTimeout(timeout);
  }, [held]);

  return held;
};
