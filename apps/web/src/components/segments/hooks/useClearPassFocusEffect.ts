import { useEffect } from 'react';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';

export const useClearPassFocusEffect = (): void => {
  useEffect(
    () => () => {
      useSegmentFocusStore.getState().clearPassFocus();
    },
    [],
  );
};
