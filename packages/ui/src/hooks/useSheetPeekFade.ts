import { useTransform, type MotionValue } from 'motion/react';
import { peekFadeOffsets, type SheetLayout } from '../lib/sheetPosition.ts';

interface SheetPeekFade {
  peekOpacity: MotionValue<number>;
  peekPointerEvents: MotionValue<'auto' | 'none'>;
  contentOpacity: MotionValue<number>;
}

const PEEK_INTERACTIVE_OPACITY = 0.5;

export const useSheetPeekFade = ({
  y,
  layout,
}: {
  y: MotionValue<number>;
  layout: SheetLayout;
}): SheetPeekFade => {
  const fade = peekFadeOffsets(layout);
  const peekOpacity = useTransform(y, fade, [0, 1]);
  const peekPointerEvents = useTransform(peekOpacity, (v): 'auto' | 'none' => {
    if (v > PEEK_INTERACTIVE_OPACITY) return 'auto';
    return 'none';
  });
  const contentOpacity = useTransform(y, fade, [1, 0]);
  return { peekOpacity, peekPointerEvents, contentOpacity };
};
