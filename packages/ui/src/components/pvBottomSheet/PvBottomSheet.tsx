import { useState, type ReactNode, type FC } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';
import { PvSheetGrabber } from '../pvSheetGrabber/PvSheetGrabber.tsx';
import {
  offsetToPosition,
  positionToOffset,
  settlePosition,
  sheetTapTarget,
} from '../../lib/sheetPosition.ts';
import { SHEET_SPRING } from '../../lib/sheetDrag.ts';
import { useGrabberDrag } from '../../hooks/useGrabberDrag.ts';
import { useSheetLayout } from '../../hooks/useSheetLayout.ts';
import { useSheetAboveMotionEffect } from '../../hooks/useSheetAboveMotionEffect.ts';
import { useSheetSpringEffect } from '../../hooks/useSheetSpringEffect.ts';
import { useSheetPeekFade } from '../../hooks/useSheetPeekFade.ts';
import {
  useSheetAboveContext,
  useSheetPeekContext,
  useSheetScrollContext,
} from './PvBottomSheetProvider.tsx';

const DIVIDER_SCROLL_THRESHOLD = 12;

interface PvBottomSheetProps {
  position: number;
  onPositionChange: (position: number) => void;
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
}

export const PvBottomSheet: FC<PvBottomSheetProps> = (props) => {
  const register = useSheetScrollContext().register;
  const peek = useSheetPeekContext();
  const layout = useSheetLayout();
  const y = useMotionValue(positionToOffset(layout, props.position));
  const grabber = useGrabberDrag();

  const peekFade = useSheetPeekFade({ y, layout });
  const [scrolled, setScrolled] = useState(false);

  useSheetAboveMotionEffect({
    registerMotion: useSheetAboveContext().registerMotion,
    y,
    height: layout.sheetHeight,
  });
  useSheetSpringEffect({ y, layout, position: props.position });

  const handleTap = () => {
    if (grabber.isDragged()) {
      return;
    }
    props.onPositionChange(sheetTapTarget(props.position));
  };

  const handleDragSettled = () => {
    let next = offsetToPosition(layout, y.get());
    if (peek.active) {
      next = settlePosition(next);
    }
    void animate(y, positionToOffset(layout, next), SHEET_SPRING);
    props.onPositionChange(next);
  };

  return (
    <motion.div
      data-sheet-position={props.position.toFixed(2)}
      {...grabber.dragProps}
      dragConstraints={{ top: 0, bottom: layout.peekOffset }}
      onDragTransitionEnd={handleDragSettled}
      style={{ y, height: layout.sheetHeight }}
      className={cn(
        GLASS_CLASS,
        'fixed inset-x-0 bottom-0 z-raised flex flex-col rounded-t-2xl border-x-0 border-b-0',
      )}
    >
      <button
        type="button"
        data-sheet-handle
        aria-label={sheetTapTarget(props.position) === 1 ? props.expandLabel : props.collapseLabel}
        onPointerDown={grabber.onHandlePointerDown}
        onClick={handleTap}
        className="flex h-12 w-full shrink-0 cursor-grab touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
      >
        <PvSheetGrabber />
      </button>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <motion.div
          ref={register}
          onScroll={(event) =>
            setScrolled(event.currentTarget.scrollTop > DIVIDER_SCROLL_THRESHOLD)
          }
          style={{
            paddingBottom: positionToOffset(layout, props.position) + layout.bottomInset,
            opacity: peek.active ? peekFade.contentOpacity : 1,
          }}
          className={cn(
            'relative min-h-0 flex-1 overflow-y-auto overscroll-contain',
            'pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]',
          )}
        >
          {props.children}
        </motion.div>
        <motion.div
          style={{ opacity: peek.active ? peekFade.contentOpacity : 1 }}
          className="pointer-events-none absolute inset-x-0 top-0 z-raised"
        >
          <div
            data-sheet-divider
            className={cn(
              'h-px bg-white/10 transition-opacity duration-200',
              scrolled ? 'opacity-100' : 'opacity-0',
            )}
          />
        </motion.div>
        <motion.div
          ref={peek.registerTarget}
          data-sheet-peek
          style={{
            height: layout.peekContentHeight,
            opacity: peekFade.peekOpacity,
            pointerEvents: peek.active ? peekFade.peekPointerEvents : 'none',
          }}
          className={cn(
            'absolute inset-x-0 top-0 flex items-start',
            'pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]',
          )}
        />
      </div>
    </motion.div>
  );
};
