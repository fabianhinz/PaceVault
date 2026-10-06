import { createContext } from 'react';
import type { MotionValue } from 'motion/react';

export interface SheetAboveMotion {
  y: MotionValue<number>;
  height: number;
  opacity: MotionValue<number>;
  pointerEvents: MotionValue<'auto' | 'none'>;
}

interface SheetAboveContextValue {
  motion: SheetAboveMotion | null;
  registerMotion: (motion: SheetAboveMotion | null) => void;
}

export const SheetAboveContext = createContext<SheetAboveContextValue>({
  motion: null,
  registerMotion: () => {},
});
