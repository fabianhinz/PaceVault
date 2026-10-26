import type { ComponentProps, FC } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS } from '../../lib/surfaces.ts';
import { PvDialogCard } from './PvDialogCard.tsx';
import { PvDialogOverlay } from './PvDialogOverlay.tsx';

interface PvDialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  scrim?: boolean;
  closeLabel: string;
}

export const PvDialogContent: FC<PvDialogContentProps> = (props) => {
  const { scrim: _scrim, closeLabel: _closeLabel, ...contentProps } = props;
  const scrim = props.scrim ?? true;
  return (
    <DialogPrimitive.Portal>
      {scrim && <PvDialogOverlay />}
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
          FLOATING_CLASS,
          'fixed z-overlay flex flex-col overflow-hidden rounded-3xl focus:outline-none',
          'bottom-(--sheet-bottom) mx-auto max-w-lg',
          'left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))]',
          'max-h-[min(75dvh,calc(100dvh-var(--sheet-top)-var(--sheet-bottom)))]',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'lg:p-6 lg:rounded-xl',
          'lg:inset-x-auto lg:right-auto lg:bottom-auto lg:mx-0 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
          'lg:w-full lg:max-w-[min(32rem,calc(100vw-25rem))] lg:max-h-[calc(100dvh-25rem)]',
          'lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0',
          'lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:zoom-out-95',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[dismissed]:animate-none!',
          props.className,
        )}
      >
        <PvDialogCard closeLabel={props.closeLabel}>{props.children}</PvDialogCard>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};
