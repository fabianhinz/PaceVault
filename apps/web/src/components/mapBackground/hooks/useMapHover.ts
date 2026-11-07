import { useEffect } from 'react';
import { useMapFocusStore, type MapHoverTarget } from '@/store/mapFocus.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useMapScene } from './useMapScene.ts';

interface MapHoverHandlers {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export const useMapHover = (target: MapHoverTarget | null): MapHoverHandlers => {
  const pointerFine = useDevice().pointerFine;
  const sceneKey = useMapScene().key;
  const kind = target?.kind;
  const id = target?.id;

  useEffect(() => {
    if (kind === undefined || id === undefined) return;
    return () => {
      useMapFocusStore.getState().clearMapHover({ kind, id });
    };
  }, [kind, id]);

  const onPointerEnter = () => {
    if (!pointerFine || target === null) return;
    useMapFocusStore.getState().setMapHover({ target, sceneKey });
  };

  const onPointerLeave = () => {
    if (!pointerFine || kind === undefined || id === undefined) return;
    useMapFocusStore.getState().clearMapHover({ kind, id });
  };

  return { onPointerEnter, onPointerLeave };
};
