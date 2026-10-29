import type { ComponentProps, FC, Ref } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/cn.ts';

interface PvSliderProps
  extends
    Required<
      Pick<
        ComponentProps<typeof SliderPrimitive.Root>,
        'value' | 'onValueChange' | 'min' | 'max' | 'step'
      >
    >,
    Pick<ComponentProps<typeof SliderPrimitive.Root>, 'disabled' | 'className'> {
  'aria-label': string;
  ref?: Ref<HTMLSpanElement>;
}

export const PvSlider: FC<PvSliderProps> = (props) => {
  return (
    <SliderPrimitive.Root
      ref={props.ref}
      value={props.value}
      onValueChange={props.onValueChange}
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
      className={cn(
        'cursor-pointer relative flex w-full touch-none items-center',
        props.disabled && 'opacity-40 pointer-events-none',
        props.className,
      )}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props['aria-label']}
        className="block h-4 w-4 rounded-full bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </SliderPrimitive.Root>
  );
};
