import type { ComponentProps, FC, Ref } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

interface PvCheckboxProps extends Pick<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  'disabled' | 'className'
> {
  'aria-label': string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
}

export const PvCheckbox: FC<PvCheckboxProps> = (props) => (
  <CheckboxPrimitive.Root
    ref={props.ref}
    checked={props.checked}
    onCheckedChange={(checked) => props.onCheckedChange(checked === true)}
    disabled={props.disabled}
    aria-label={props['aria-label']}
    className={cn(
      'grid size-4 shrink-0 cursor-pointer place-items-center rounded border border-white/20 text-white transition-colors',
      'hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
      'disabled:pointer-events-none disabled:opacity-40',
      props.className,
    )}
  >
    <CheckboxPrimitive.Indicator>
      <Check className="size-3" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
