import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidatePersonalBests } from '@/features/records/hooks/usePersonalBests.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { reprocessOutdatedSessions } from '../reprocessSessions.ts';

export const useSessionReprocessingEffect = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (useSessionReprocessingStore.getState().phase !== 'pending') return;
    reprocessOutdatedSessions()
      .then((reprocessed) => {
        if (reprocessed > 0) invalidatePersonalBests(queryClient);
      })
      .catch((err: unknown) => console.error('Reprocessing sessions failed:', err));
  }, [queryClient]);
};
