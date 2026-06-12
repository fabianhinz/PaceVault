import { useCallback, useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

export const useSessionHover = (sessionId: string) => {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    return () => {
      useMapFocusStore.getState().setHoveredSession(null);
    };
  }, []);

  const onPointerEnter = useCallback(() => {
    if (isDesktop) {
      useMapFocusStore.getState().setHoveredSession(sessionId);
    }
  }, [sessionId, isDesktop]);

  const onPointerLeave = useCallback(() => {
    if (isDesktop) {
      useMapFocusStore.getState().setHoveredSession(null);
    }
  }, [isDesktop]);

  return { onPointerEnter, onPointerLeave };
};
