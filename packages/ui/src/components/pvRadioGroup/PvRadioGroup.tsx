import type { ComponentProps, FC, ReactNode } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/cn.ts';

interface PvRadioGroupProps extends Pick<
  ComponentProps<typeof RadioGroupPrimitive.Root>,
  'value' | 'onValueChange' | 'className'
> {
  children: ReactNode;
}

export const PvRadioGroup: FC<PvRadioGroupProps> = (props) => (
  <RadioGroupPrimitive.Root
    value={props.value}
    onValueChange={props.onValueChange}
    className={cn('flex flex-col gap-2', props.className)}
  >
    {props.children}
  </RadioGroupPrimitive.Root>
);
