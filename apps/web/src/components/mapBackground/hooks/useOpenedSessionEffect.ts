import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';

export const useOpenedSessionEffect = (sessionId: string | null): void => {
  useEffect(() => {
    useMapFocusStore.getState().setOpenedSession(sessionId);
  }, [sessionId]);
};
