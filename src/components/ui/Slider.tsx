import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils.ts';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Slider = (props: SliderProps) => {
  return (
    <SliderPrimitive.Root
      value={props.value}
      onValueChange={props.onValueChange}
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
      className={cn(
        'cursor-pointer relative flex w-full touch-none select-none items-center',
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
