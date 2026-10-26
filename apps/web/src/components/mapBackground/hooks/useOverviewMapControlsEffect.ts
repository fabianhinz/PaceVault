import { useEffect } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import type { MapTrack } from './types.ts';

export const useOverviewMapControlsEffect = (tracks: MapTrack[]): void => {
  const shown = tracks.length > 0;
  useEffect(() => {
    useMapControlsStore.getState().setOverviewMapControlsShown(shown);
  }, [shown]);
};
