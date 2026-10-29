import { useEffect } from 'react';
import type { MotionValue } from 'motion/react';
import type { SheetAboveMotion } from '../components/pvBottomSheet/types.ts';

export const useSheetAboveMotionEffect = ({
  registerMotion,
  y,
  height,
}: {
  registerMotion: (motion: SheetAboveMotion | null) => void;
  y: MotionValue<number>;
  height: number;
}): void => {
  useEffect(() => {
    registerMotion({ y, height });
    return () => registerMotion(null);
  }, [registerMotion, y, height]);
};
