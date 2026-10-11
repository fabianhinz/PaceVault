import { useMemo } from 'react';
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverAnchor } from './Popover.tsx';
import { DialogRoot, DialogTrigger, DialogContent, DialogTitle } from './Dialog.tsx';
import { cn } from '@/lib/utils.ts';
import type { ReactNode } from 'react';
import type { PopoverContentProps } from '@radix-ui/react-popover';

interface ResponsivePopoverProps {
  trigger?: ReactNode;
  /** Viewport point the desktop popover is anchored to, in place of a trigger. */
  anchor?: { x: number; y: number };
  title: string;
  side?: PopoverContentProps['side'];
  align?: PopoverContentProps['align'];
  collisionPadding?: PopoverContentProps['collisionPadding'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}

const PointAnchor = (props: { x: number; y: number }) => {
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          DOMRect.fromRect({ x: props.x, y: props.y, width: 0, height: 0 }),
      },
    }),
    [props.x, props.y],
  );
  return <PopoverAnchor virtualRef={virtualRef} />;
};

export const ResponsivePopover = (props: ResponsivePopoverProps) => {
  const device = useDevice();

  if (device.isDesktop) {
    return (
      <PopoverRoot open={props.open} onOpenChange={props.onOpenChange}>
        {props.anchor && <PointAnchor x={props.anchor.x} y={props.anchor.y} />}
        {props.trigger !== undefined && <PopoverTrigger asChild>{props.trigger}</PopoverTrigger>}
        <PopoverContent
          side={props.side}
          align={props.align}
          collisionPadding={props.collisionPadding}
          className={props.className}
        >
          {props.children}
        </PopoverContent>
      </PopoverRoot>
    );
  }

  return (
    <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger !== undefined && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent aria-describedby={undefined} className={cn('p-4', props.className)}>
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        {props.children}
      </DialogContent>
    </DialogRoot>
  );
};
