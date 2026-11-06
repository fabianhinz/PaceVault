import { useEffect } from 'react';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';

export const useClearExplorerMarkersEffect = (): void => {
  useEffect(
    () => () => {
      useSegmentFocusStore.getState().clearExplorerMarkers();
    },
    [],
  );
};
