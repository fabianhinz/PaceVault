import { useEffect } from 'react';
import { animate, type MotionValue } from 'motion/react';
import { positionToOffset, type SheetLayout } from '../lib/sheetPosition.ts';
import { SHEET_SPRING } from '../lib/sheetDrag.ts';

export const useSheetSpringEffect = ({
  y,
  layout,
  position,
}: {
  y: MotionValue<number>;
  layout: SheetLayout;
  position: number;
}): void => {
  useEffect(() => {
    const controls = animate(y, positionToOffset(layout, position), SHEET_SPRING);
    return () => controls.stop();
  }, [y, layout, position]);
};
