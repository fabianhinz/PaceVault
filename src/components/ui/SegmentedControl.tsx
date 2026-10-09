import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils.ts';
import { glassClass } from './Card.tsx';

type Option = { value: string; label: string };

type SegmentedControlProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  className?: string;
};

export const SegmentedControl = (props: SegmentedControlProps) => {
  return (
    <ToggleGroup.Root
      type="single"
      value={props.value}
      onValueChange={(v) => {
        if (v) props.onValueChange(v);
      }}
      className={cn(glassClass, 'flex flex-row gap-2 rounded-2xl w-full p-2', props.className)}
    >
      {props.options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className="flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary transition-colors cursor-pointer hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=on]:bg-white/10 data-[state=on]:text-text-primary"
        >
          {opt.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
};
