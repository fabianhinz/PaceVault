import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { SheetAboveContext } from './sheetAboveContext.ts';

export const SheetAbove = (props: { children: ReactNode }) => {
  const sheet = useContext(SheetAboveContext).motion;
  if (!sheet) {
    return null;
  }
  return createPortal(
    <motion.div
      data-sheet-above
      style={{ y: sheet.y, height: sheet.height }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10"
    >
      <motion.div
        style={{ opacity: sheet.opacity, pointerEvents: sheet.pointerEvents }}
        className="absolute inset-x-0 bottom-full flex justify-center pb-3"
      >
        {props.children}
      </motion.div>
    </motion.div>,
    document.body,
  );
};
