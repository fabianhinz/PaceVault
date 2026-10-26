import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ChangedPayload } from '@site/lib/devPlugin.ts';
import { boardQueryKey } from './useBoard.ts';

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    'wb:changed': ChangedPayload;
  }
}

export const useBoardChangedEffect = (): void => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const hot = import.meta.hot;
    if (hot === undefined) return undefined;
    const onChanged = () => {
      void queryClient.invalidateQueries({ queryKey: boardQueryKey() });
    };
    hot.on('wb:changed', onChanged);
    return () => hot.off('wb:changed', onChanged);
  }, [queryClient]);
};
