import { useEffect } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';

export const useMarkSessionSeenEffect = (sessionId: string | undefined): void => {
  useEffect(() => {
    if (sessionId) {
      useSessionsStore.getState().markSessionSeen(sessionId);
    }
  }, [sessionId]);
};
