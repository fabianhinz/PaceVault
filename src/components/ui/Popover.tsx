import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils.ts';
import { floatingClass } from './Card.tsx';

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

const isFocusElsewhere = () =>
  document.activeElement !== null && document.activeElement !== document.body;

export const PopoverContent = (props: PopoverPrimitive.PopoverContentProps) => {
  const { className, sideOffset = 4, ...rest } = props;
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          floatingClass,
          'z-50 max-w-xs rounded-xl p-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        sideOffset={sideOffset}
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
