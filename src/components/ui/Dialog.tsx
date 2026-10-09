import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils.ts';
import { floatingClass } from './Card.tsx';

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogOverlay = (props: DialogPrimitive.DialogOverlayProps) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...rest}
    />
  );
};

export const DialogContent = (props: DialogPrimitive.DialogContentProps) => {
  const { className, children, ...rest } = props;
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          floatingClass,
          'fixed z-50 p-6 focus:outline-none overflow-y-auto',
          'inset-x-0 bottom-0 w-full max-h-[85dvh] rounded-t-2xl',
          'max-lg:pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'max-lg:pl-[max(1.5rem,env(safe-area-inset-left))] max-lg:pr-[max(1.5rem,env(safe-area-inset-right))]',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl',
          'lg:w-full lg:max-w-[min(32rem,calc(100vw-25rem))] lg:max-h-[calc(100dvh-25rem)]',
          'lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0',
          'lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:zoom-out-95',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          className,
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...rest}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

export const DialogTitle = (props: DialogPrimitive.DialogTitleProps) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-bold text-text-primary', className)}
      {...rest}
    />
  );
};

export const DialogDescription = (props: DialogPrimitive.DialogDescriptionProps) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Description
      className={cn('mt-2 text-sm text-text-tertiary', className)}
      {...rest}
    />
  );
};
