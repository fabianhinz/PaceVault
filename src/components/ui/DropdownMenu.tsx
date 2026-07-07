import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils.ts';

export const DropdownMenuRoot = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = (props: DropdownMenuPrimitive.DropdownMenuContentProps) => {
  const { className, sideOffset = 8, ...rest } = props;
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[160px] bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl p-1',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

export const DropdownMenuItem = (
  props: DropdownMenuPrimitive.DropdownMenuItemProps & { variant?: 'default' | 'danger' },
) => {
  const { className, variant, ...rest } = props;
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary outline-none transition-colors hover:bg-white/10 focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        variant === 'danger' && 'text-status-danger focus:text-status-danger',
        className,
      )}
      {...rest}
    />
  );
};
