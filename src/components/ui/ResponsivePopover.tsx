import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { PopoverRoot, PopoverTrigger, PopoverContent } from './Popover.tsx';
import { DialogRoot, DialogTrigger, DialogContent, DialogTitle } from './Dialog.tsx';
import { cn } from '@/lib/utils.ts';
import type { ReactNode } from 'react';
import type { PopoverContentProps } from '@radix-ui/react-popover';

interface ResponsivePopoverProps {
  trigger: ReactNode;
  title: string;
  side?: PopoverContentProps['side'];
  align?: PopoverContentProps['align'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}

export const ResponsivePopover = (props: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <PopoverRoot open={props.open} onOpenChange={props.onOpenChange}>
        <PopoverTrigger asChild>{props.trigger}</PopoverTrigger>
        <PopoverContent side={props.side} align={props.align} className={props.className}>
          {props.children}
        </PopoverContent>
      </PopoverRoot>
    );
  }

  return (
    <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined} className={cn('p-4', props.className)}>
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        {props.children}
      </DialogContent>
    </DialogRoot>
  );
};
