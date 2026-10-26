import type { PropsWithChildren, FC } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useUnstableSheetAboveContext } from './PvBottomSheetProvider.tsx';

export const PvSheetAbove: FC<PropsWithChildren> = (props) => {
  const context = useUnstableSheetAboveContext();
  if (context === undefined) {
    console.warn('PvSheetAbove rendered outside PvBottomSheetProvider; nothing is shown.');
    return null;
  }
  const sheet = context.motion;
  if (!sheet) {
    return null;
  }
  return createPortal(
    <motion.div
      data-sheet-above
      style={{ y: sheet.y, height: sheet.height }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-raised"
    >
      <div className="absolute inset-x-0 bottom-full flex justify-center pb-3">
        {props.children}
      </div>
    </motion.div>,
    document.body,
  );
};
