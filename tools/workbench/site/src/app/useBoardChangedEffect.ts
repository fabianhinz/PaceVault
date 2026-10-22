import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ChangedPayload } from '../lib/devPlugin.ts';

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    'wb:changed': ChangedPayload;
  }
}

/**
 * A file under the backlog or `GUIDE.md` changed (the board's own write, an agent, an editor):
 * the dev plugin sends `wb:changed` and the board refetches, without a page reload.
 */
export const useBoardChangedEffect = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const hot = import.meta.hot;
    if (hot === undefined) return undefined;
    const onChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    };
    hot.on('wb:changed', onChanged);
    return () => hot.off('wb:changed', onChanged);
  }, [queryClient]);
};
