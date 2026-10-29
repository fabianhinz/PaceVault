import {
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FC,
  type ReactNode,
  type Ref,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { animate, motion, useMotionValue, type PanInfo } from 'motion/react';
import { useDevice } from '../../hooks/useDevice.ts';
import { useGrabberDrag } from '../../hooks/useGrabberDrag.ts';
import { SHEET_DRAG_ELASTIC, SHEET_SPRING, shouldDismiss } from '../../lib/sheetDrag.ts';
import { DOCK_ROW_BOTTOM_CSS } from '../../lib/dockGeometry.ts';
import { SHEET_TOP_GAP_CSS } from '../../lib/sheetPosition.ts';
import { PvSheetGrabber } from '../pvSheetGrabber/PvSheetGrabber.tsx';

const CARD_PLACEMENT_STYLE = {
  '--sheet-bottom': DOCK_ROW_BOTTOM_CSS,
  '--sheet-top': SHEET_TOP_GAP_CSS,
} as CSSProperties;

const assignRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
};

interface PvDialogCardProps extends ComponentProps<typeof motion.div> {
  closeLabel: string;
}

export const PvDialogCard: FC<PvDialogCardProps> = (props) => {
  const { closeLabel: _closeLabel, ...motionProps } = props;
  const device = useDevice();
  const grabber = useGrabberDrag();
  const y = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const grabberRef = useRef<HTMLButtonElement>(null);
  const dismissingRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    const height = card.offsetHeight;
    if (!shouldDismiss({ offset: info.offset.y, velocity: info.velocity.y, height })) {
      void animate(y, 0, SHEET_SPRING);
      return;
    }
    const restingBottom = card.getBoundingClientRect().bottom - y.get();
    const bottomOffset = window.innerHeight - restingBottom;
    dismissingRef.current = true;
    setDismissed(true);
    void animate(y, height + bottomOffset, SHEET_SPRING).then(() => {
      grabberRef.current?.click();
      requestAnimationFrame(() => {
        if (cardRef.current?.dataset.state !== 'open') {
          return;
        }
        dismissingRef.current = false;
        setDismissed(false);
        void animate(y, 0, SHEET_SPRING);
      });
    });
  };

  return (
    <motion.div
      {...motionProps}
      {...grabber.dragProps}
      ref={(node: HTMLDivElement | null) => {
        cardRef.current = node;
        assignRef(props.ref, node);
      }}
      drag={device.desktop ? false : 'y'}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: SHEET_DRAG_ELASTIC }}
      onDragEnd={handleDragEnd}
      data-dismissed={dismissed ? '' : undefined}
      style={{ ...props.style, ...CARD_PLACEMENT_STYLE, y }}
    >
      <DialogPrimitive.Close
        ref={grabberRef}
        aria-label={props.closeLabel}
        onPointerDown={grabber.onHandlePointerDown}
        onClick={(event) => {
          if (grabber.isDragged() && !dismissingRef.current) {
            event.preventDefault();
          }
        }}
        className="flex h-12 w-full shrink-0 cursor-grab touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing lg:hidden"
      >
        <PvSheetGrabber />
      </DialogPrimitive.Close>
      {props.children as ReactNode}
    </motion.div>
  );
};
