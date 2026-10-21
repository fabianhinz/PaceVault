import { useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { animate, motion, useMotionValue, type HTMLMotionProps, type PanInfo } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn.ts';
import { useDevice } from '../hooks/useDevice.ts';
import { useGrabberDrag } from '../hooks/useGrabberDrag.ts';
import { useScrollFadeEffect } from '../hooks/useScrollFadeEffect.ts';
import { SHEET_SPRING, shouldDismiss } from '../lib/sheetDrag.ts';
import { DOCK_ROW_BOTTOM_CSS } from '../lib/dockGeometry.ts';
import { SHEET_HANDLE_HEIGHT, SHEET_TOP_GAP_CSS } from '../lib/sheetPosition.ts';
import { m } from '@pacevault/i18n/messages.js';
import { floatingClass, scrimClass } from './Card.tsx';
import { Chip } from './Chip.tsx';
import { SheetGrabber } from './SheetGrabber.tsx';
import { Typography } from './Typography.tsx';

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogOverlay = (props: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    {...props}
    className={cn(
      scrimClass,
      'lg:bg-transparent lg:backdrop-blur-xl',
      'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      props.className,
    )}
  />
);

const cardPlacementStyle = {
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

const DialogCard = (props: HTMLMotionProps<'div'>) => {
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
      animate(y, 0, SHEET_SPRING);
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
        animate(y, 0, SHEET_SPRING);
      });
    });
  };

  return (
    <motion.div
      {...props}
      {...grabber.dragProps}
      ref={(node: HTMLDivElement | null) => {
        cardRef.current = node;
        assignRef(props.ref, node);
      }}
      drag={device.isDesktop ? false : 'y'}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.08 }}
      onDragEnd={handleDragEnd}
      data-dismissed={dismissed ? '' : undefined}
      style={{ ...props.style, ...cardPlacementStyle, y }}
    >
      <DialogPrimitive.Close
        ref={grabberRef}
        aria-label={m.ui_sheet_drag_close()}
        onPointerDown={grabber.onHandlePointerDown}
        onClick={(event) => {
          if (grabber.wasDragged() && !dismissingRef.current) {
            event.preventDefault();
          }
        }}
        style={{ height: SHEET_HANDLE_HEIGHT }}
        className="flex w-full shrink-0 cursor-grab touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing lg:hidden"
      >
        <SheetGrabber />
      </DialogPrimitive.Close>
      {props.children as ReactNode}
    </motion.div>
  );
};

interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  /** false: no overlay, and outside taps never close it (pair with `DialogRoot modal={false}`). */
  scrim?: boolean;
}

export const DialogContent = (props: DialogContentProps) => {
  const { scrim: _scrim, ...contentProps } = props;
  const scrim = props.scrim ?? true;
  return (
    <DialogPrimitive.Portal>
      {scrim && <DialogOverlay />}
      <DialogPrimitive.Content
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...contentProps}
        onPointerDownOutside={(e) => {
          if (!scrim) e.preventDefault();
          props.onPointerDownOutside?.(e);
        }}
        onInteractOutside={(e) => {
          if (!scrim) e.preventDefault();
          props.onInteractOutside?.(e);
        }}
        asChild
        className={cn(
          floatingClass,
          'fixed z-50 flex flex-col overflow-hidden rounded-3xl focus:outline-none',
          'bottom-(--sheet-bottom) mx-auto max-w-lg',
          'left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))]',
          'max-h-[min(75dvh,calc(100dvh-var(--sheet-top)-var(--sheet-bottom)))]',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'lg:block lg:p-6 lg:overflow-y-auto lg:rounded-xl',
          'lg:inset-x-auto lg:right-auto lg:bottom-auto lg:mx-0 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
          'lg:w-full lg:max-w-[min(32rem,calc(100vw-25rem))] lg:max-h-[calc(100dvh-25rem)]',
          'lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0',
          'lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:zoom-out-95',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[dismissed]:animate-none!',
          props.className,
        )}
      >
        <DialogCard>{props.children}</DialogCard>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  chip?: string;
  /** Buttons at the right end of the header row (e.g. Close), at every width. */
  actions?: ReactNode;
}

export const DialogHeader = (props: DialogHeaderProps) => {
  const Icon = props.icon;
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-2 px-5 lg:min-h-0 lg:p-0">
      {Icon && <Icon className="size-4 shrink-0 text-text-tertiary lg:hidden" />}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <DialogTitle className="max-lg:truncate">{props.title}</DialogTitle>
          {props.chip !== undefined && <Chip className="shrink-0">{props.chip}</Chip>}
        </div>
        {props.subtitle !== undefined && (
          <Typography variant="caption" as="p">
            {props.subtitle}
          </Typography>
        )}
      </div>
      {props.actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-2">{props.actions}</div>
      )}
    </div>
  );
};

export const DialogBody = (props: { className?: string; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(ref);
  return (
    <div
      ref={ref}
      className={cn(
        'scroll-fade min-h-0 shrink overflow-y-auto overscroll-contain px-5 pt-1 pb-5 lg:contents',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};

export const DialogFooter = (props: { className?: string; children: ReactNode }) => (
  <div
    className={cn(
      'grid shrink-0 grid-cols-2 gap-2 px-5 pt-1 pb-5 max-lg:[&>*]:w-full',
      'lg:mt-4 lg:flex lg:justify-end lg:gap-2 lg:p-0',
      props.className,
    )}
  >
    {props.children}
  </div>
);

export const DialogTitle = (props: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title
    {...props}
    className={cn(
      'text-base font-medium text-text-primary lg:text-lg lg:font-bold',
      props.className,
    )}
  />
);

export const DialogDescription = (props: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description
    {...props}
    className={cn('text-sm text-text-tertiary lg:mt-2', props.className)}
  />
);
