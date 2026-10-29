import type { ComponentProps, FC } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS } from '../../lib/surfaces.ts';

const SELECT_SIDE_OFFSET = 4;

export const PvSelectContent: FC<ComponentProps<typeof SelectPrimitive.Content>> = (props) => {
  const { className: _className, children: _children, ...rest } = props;
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          FLOATING_CLASS,
          'relative z-overlay w-[var(--radix-select-trigger-width)] max-h-64 overflow-hidden rounded-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.className,
        )}
        position="popper"
        sideOffset={SELECT_SIDE_OFFSET}
        {...rest}
      >
        <SelectPrimitive.Viewport className="p-1">{props.children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};
