import type { ComponentProps, FC } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn.ts';
import { SCRIM_CLASS } from '../../lib/surfaces.ts';

export const PvDialogOverlay: FC<ComponentProps<typeof DialogPrimitive.Overlay>> = (props) => (
  <DialogPrimitive.Overlay
    {...props}
    className={cn(
      SCRIM_CLASS,
      'lg:bg-transparent lg:backdrop-blur-xl',
      'fixed inset-0 z-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      props.className,
    )}
  />
);
