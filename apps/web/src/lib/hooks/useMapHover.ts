import { useCallback, useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';

const setHovered = {
  session: (id: string | null) => useMapFocusStore.getState().setHoveredSession(id),
  studioRoute: (id: string | null) => useMapFocusStore.getState().setHoveredStudioRoute(id),
};

type MapHoverKind = keyof typeof setHovered;

/**
 * Hovering a list item highlights the matching entity on the map (fine
 * pointer only — a tap on touch would leave the highlight stuck); leaving or
 * unmounting clears the highlight.
 */
export const useMapHover = (kind: MapHoverKind, id: string) => {
  const pointerFine = useDevice().pointerFine;

  useEffect(() => {
    return () => {
      setHovered[kind](null);
    };
  }, [kind]);

  const onPointerEnter = useCallback(() => {
    if (pointerFine) {
      setHovered[kind](id);
    }
  }, [kind, id, pointerFine]);

  const onPointerLeave = useCallback(() => {
    if (pointerFine) {
      setHovered[kind](null);
    }
  }, [kind, pointerFine]);

  return { onPointerEnter, onPointerLeave };
};
