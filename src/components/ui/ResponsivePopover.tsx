import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { PopoverRoot, PopoverTrigger, PopoverContent } from './Popover.tsx';
import { DialogRoot, DialogTrigger, DialogContent, DialogTitle } from './Dialog.tsx';
import { cn } from '@/lib/utils.ts';
import type { ReactNode } from 'react';
import type { PopoverContentProps } from '@radix-ui/react-popover';

interface ResponsivePopoverProps {
  trigger: ReactNode;
  /** Accessible title for the mobile bottom sheet (visually hidden). */
  title: string;
  side?: PopoverContentProps['side'];
  className?: string;
  children: ReactNode;
}

/**
 * Popover on desktop, bottom-sheet Dialog on mobile (< lg).
 */
export const ResponsivePopover = (props: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <PopoverRoot>
        <PopoverTrigger asChild>{props.trigger}</PopoverTrigger>
        <PopoverContent side={props.side} className={props.className}>
          {props.children}
        </PopoverContent>
      </PopoverRoot>
    );
  }

  return (
    <DialogRoot>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined} className={cn('p-4', props.className)}>
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        {props.children}
      </DialogContent>
    </DialogRoot>
  );
};
