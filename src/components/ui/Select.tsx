import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = (props: SelectPrimitive.SelectTriggerProps) => {
  const { className, children, ...rest } = props;
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary cursor-pointer placeholder:text-text-quaternary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown size={12} strokeWidth={1.5} className="text-text-tertiary" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

export const SelectContent = (props: SelectPrimitive.SelectContentProps) => {
  const { className, children, ...rest } = props;
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 w-[var(--radix-select-trigger-width)] max-h-64 overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        position="popper"
        sideOffset={4}
        {...rest}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};

export const SelectItem = (props: SelectPrimitive.SelectItemProps) => {
  const { className, children, ...rest } = props;
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-text-primary outline-none hover:bg-white/10 focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
};
