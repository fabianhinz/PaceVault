import type { ComponentProps, FC, ReactNode, Ref } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/cn.ts';

interface PvRadioGroupItemProps
  extends
    Required<Pick<ComponentProps<typeof RadioGroupPrimitive.Item>, 'value'>>,
    Pick<ComponentProps<typeof RadioGroupPrimitive.Item>, 'disabled' | 'className'> {
  'aria-label': string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export const PvRadioGroupItem: FC<PvRadioGroupItemProps> = (props) => (
  <RadioGroupPrimitive.Item
    ref={props.ref}
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
