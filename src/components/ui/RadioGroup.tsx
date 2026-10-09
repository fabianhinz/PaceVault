import type { ReactNode } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils.ts';

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const RadioGroup = (props: RadioGroupProps) => (
  <RadioGroupPrimitive.Root
    value={props.value}
    onValueChange={props.onValueChange}
    className={cn('flex flex-col gap-2', props.className)}
  >
    {props.children}
  </RadioGroupPrimitive.Root>
);

interface RadioGroupItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const RadioGroupItem = (props: RadioGroupItemProps) => (
  <RadioGroupPrimitive.Item
    value={props.value}
    disabled={props.disabled}
    aria-label={props['aria-label']}
    className={cn(
      'group flex w-full cursor-pointer items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      props.className,
    )}
  >
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30 transition-colors">
      <RadioGroupPrimitive.Indicator className="block h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
    {props.children}
  </RadioGroupPrimitive.Item>
);
