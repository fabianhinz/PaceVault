import { useCallback, useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

export const useStudioRouteHover = (routeId: string) => {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    return () => {
      useMapFocusStore.getState().setHoveredStudioRoute(null);
    };
  }, []);

  const onPointerEnter = useCallback(() => {
    if (isDesktop) {
      useMapFocusStore.getState().setHoveredStudioRoute(routeId);
    }
  }, [routeId, isDesktop]);

  const onPointerLeave = useCallback(() => {
    if (isDesktop) {
      useMapFocusStore.getState().setHoveredStudioRoute(null);
    }
  }, [isDesktop]);

  return { onPointerEnter, onPointerLeave };
};
