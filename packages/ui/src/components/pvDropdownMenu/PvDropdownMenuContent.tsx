import type { ComponentProps, FC } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS } from '../../lib/surfaces.ts';

const DEFAULT_DROPDOWN_MENU_SIDE_OFFSET = 8;

export const PvDropdownMenuContent: FC<ComponentProps<typeof DropdownMenuPrimitive.Content>> = (
  props,
) => {
  const { className: _className, sideOffset: _sideOffset, ...rest } = props;
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={props.sideOffset ?? DEFAULT_DROPDOWN_MENU_SIDE_OFFSET}
        className={cn(
          FLOATING_CLASS,
          'z-overlay min-w-160px rounded-xl p-1',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
};
