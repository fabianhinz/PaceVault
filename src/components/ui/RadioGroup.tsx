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
  'aria-label'?: string;
}

/**
 * A selectable row that is itself the radio control (whole row is clickable).
 * The radio indicator renders leading, before the row content (Material spec).
 */
export const RadioGroupItem = (props: RadioGroupItemProps) => (
  <RadioGroupPrimitive.Item
    value={props.value}
    aria-label={props['aria-label']}
    className={cn(
      'group flex w-full cursor-pointer items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken',
      props.className,
    )}
  >
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30 transition-colors">
      <RadioGroupPrimitive.Indicator className="block h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
    {props.children}
  </RadioGroupPrimitive.Item>
);
