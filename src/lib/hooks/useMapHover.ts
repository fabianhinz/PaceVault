import { useCallback, useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

const setHovered = {
  session: (id: string | null) => useMapFocusStore.getState().setHoveredSession(id),
  studioRoute: (id: string | null) => useMapFocusStore.getState().setHoveredStudioRoute(id),
};

export type MapHoverKind = keyof typeof setHovered;

/**
 * Hovering a list item highlights the matching entity on the map (desktop
 * only — touch has no hover); leaving or unmounting clears the highlight.
 */
export const useMapHover = (kind: MapHoverKind, id: string) => {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    return () => {
      setHovered[kind](null);
    };
  }, [kind]);

  const onPointerEnter = useCallback(() => {
    if (isDesktop) {
      setHovered[kind](id);
    }
  }, [kind, id, isDesktop]);

  const onPointerLeave = useCallback(() => {
    if (isDesktop) {
      setHovered[kind](null);
    }
  }, [kind, isDesktop]);

  return { onPointerEnter, onPointerLeave };
};
