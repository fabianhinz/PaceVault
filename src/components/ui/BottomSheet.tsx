import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useDragControls, useMotionValue, useTransform } from 'motion/react';
import { cn } from '@/lib/utils.ts';
import { glassClass } from './Card.tsx';
import {
  offsetToPosition,
  peekFadeOffsets,
  positionToOffset,
  readSheetLayout,
  settlePosition,
  sheetTapTarget,
} from '@/lib/sheetPosition.ts';
import { m } from '@/paraglide/messages.js';
import { SheetScrollContext } from '@/lib/hooks/useSheetScrollElement.ts';
import { SheetPeekContext } from './sheetPeekContext.ts';

export const BottomSheetProvider = (props: { children: ReactNode }) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [peekTarget, setPeekTarget] = useState<HTMLDivElement | null>(null);
  const [peekActive, setPeekActive] = useState(false);
  return (
    <SheetScrollContext.Provider value={{ element, register: setElement }}>
      <SheetPeekContext.Provider
        value={{
          target: peekTarget,
          registerTarget: setPeekTarget,
          active: peekActive,
          setActive: setPeekActive,
        }}
      >
        {props.children}
      </SheetPeekContext.Provider>
    </SheetScrollContext.Provider>
  );
};

const spring = { type: 'spring', stiffness: 400, damping: 40 } as const;

const DIVIDER_SCROLL_THRESHOLD = 12;

const momentum = { power: 0.3, timeConstant: 200, bounceStiffness: 400, bounceDamping: 40 };

interface BottomSheetProps {
  position: number;
  onPositionChange: (position: number) => void;
  children: ReactNode;
}

export const BottomSheet = (props: BottomSheetProps) => {
  const register = useContext(SheetScrollContext).register;
  const peek = useContext(SheetPeekContext);
  const [layout, setLayout] = useState(readSheetLayout);
  const y = useMotionValue(positionToOffset(layout, props.position));
  const dragControls = useDragControls();
  const draggedRef = useRef(false);

  const fade = peekFadeOffsets(layout);
  const peekOpacity = useTransform(y, fade, [0, 1]);
  const peekPointerEvents = useTransform(peekOpacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  const contentOpacity = useTransform(y, fade, [1, 0]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleResize = () => setLayout(readSheetLayout());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const controls = animate(y, positionToOffset(layout, props.position), spring);
    return () => controls.stop();
  }, [y, layout, props.position]);

  const handleTap = () => {
    if (draggedRef.current) {
      return;
    }
    props.onPositionChange(sheetTapTarget(props.position));
  };

  const handleDragSettled = () => {
    let next = offsetToPosition(layout, y.get());
    if (peek.active) {
      next = settlePosition(next);
    }
    animate(y, positionToOffset(layout, next), spring);
    props.onPositionChange(next);
  };

  return (
    <motion.div
      data-sheet-position={props.position.toFixed(2)}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: layout.peekOffset }}
      dragElastic={0.08}
      dragTransition={momentum}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onDragTransitionEnd={handleDragSettled}
      style={{ y, height: layout.sheetHeight }}
      className={cn(
        glassClass,
        'fixed inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-x-0 border-b-0',
      )}
    >
      <button
        type="button"
        data-sheet-handle
        aria-label={
          sheetTapTarget(props.position) === 1 ? m.ui_sheet_expand() : m.ui_sheet_collapse()
        }
        onPointerDown={(event) => {
          draggedRef.current = false;
          dragControls.start(event);
        }}
        onClick={handleTap}
        style={{ height: layout.handleHeight }}
        className="flex w-full shrink-0 cursor-grab touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
      >
        <span className="h-1 w-10 rounded-full bg-white/30" />
      </button>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <motion.div
          ref={register}
          onScroll={(event) =>
            setScrolled(event.currentTarget.scrollTop > DIVIDER_SCROLL_THRESHOLD)
          }
          style={{
            paddingBottom: positionToOffset(layout, props.position) + layout.bottomInset,
            opacity: peek.active ? contentOpacity : 1,
          }}
          className={cn(
            'relative min-h-0 flex-1 overflow-y-auto overscroll-contain',
            'pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]',
          )}
        >
          {props.children}
        </motion.div>
        <motion.div
          style={{ opacity: peek.active ? contentOpacity : 1 }}
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
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
            opacity: peekOpacity,
            pointerEvents: peek.active ? peekPointerEvents : 'none',
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
