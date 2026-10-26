import { useEffect } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import type { ColorMode } from '@/lib/colors/colorModes.ts';

export const useTrackColorModeEffect = (mode: ColorMode): void => {
  useEffect(() => {
    useMapControlsStore.getState().setTrackColorMode(mode);
  }, [mode]);
};
