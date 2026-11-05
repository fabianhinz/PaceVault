import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';

export const useOpenedSessionEffect = (sessionId: string | null): void => {
  useEffect(() => {
    if (sessionId === null) {
      useMapControlsStore.getState().resetSessionControlsOnSessionClose();
      useMapFocusStore.getState().clearHoveredPoint();
      return;
    }
    useMapControlsStore.getState().resetSessionControlsOnSessionOpen();
  }, [sessionId]);
};
