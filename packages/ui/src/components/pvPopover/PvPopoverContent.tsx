import type { ComponentProps, FC } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS } from '../../lib/surfaces.ts';

const DEFAULT_POPOVER_SIDE_OFFSET = 4;

const isFocusElsewhere = () =>
  document.activeElement !== null && document.activeElement !== document.body;

export const PvPopoverContent: FC<ComponentProps<typeof PopoverPrimitive.Content>> = (props) => {
  const { className: _className, sideOffset: _sideOffset, ...rest } = props;
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          FLOATING_CLASS,
          'z-overlay max-w-xs rounded-xl p-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.className,
        )}
        sideOffset={props.sideOffset ?? DEFAULT_POPOVER_SIDE_OFFSET}
        avoidCollisions
        {...rest}
        onCloseAutoFocus={(event) => {
          props.onCloseAutoFocus?.(event);
          if (isFocusElsewhere()) event.preventDefault();
        }}
      />
    </PopoverPrimitive.Portal>
  );
};
