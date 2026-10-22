import { createContext } from 'react';
import type { MotionValue } from 'motion/react';

export interface SheetAboveMotion {
  y: MotionValue<number>;
  height: number;
}

interface SheetAboveContextValue {
  motion: SheetAboveMotion | null;
  registerMotion: (motion: SheetAboveMotion | null) => void;
}

export const SheetAboveContext = createContext<SheetAboveContextValue>({
  motion: null,
  registerMotion: () => {},
});

export const SHEET_ABOVE_GAP = 12;
