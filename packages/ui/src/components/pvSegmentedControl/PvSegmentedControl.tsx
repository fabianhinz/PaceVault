import type { FC } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

type Option = { value: string; label: string; disabled?: boolean; tooltip?: string };

type SegmentedControlSize = 'md' | 'sm';

const ROOT_CLASSES_BY_SEGMENTED_CONTROL_SIZE: Record<SegmentedControlSize, string> = {
  md: 'gap-2 rounded-2xl w-full p-2',
  sm: 'gap-1 rounded-md p-0.5 shrink-0',
};

const ITEM_CLASSES_BY_SEGMENTED_CONTROL_SIZE: Record<SegmentedControlSize, string> = {
  md: 'flex-1 rounded-lg px-3 py-2',
  sm: 'rounded-sm px-2 text-xs leading-5 whitespace-nowrap',
};

interface PvSegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  size?: SegmentedControlSize;
  'aria-label'?: string;
  className?: string;
}

export const PvSegmentedControl: FC<PvSegmentedControlProps> = (props) => {
  const size = props.size ?? 'md';
  return (
    <ToggleGroup.Root
      type="single"
      value={props.value}
      onValueChange={(v) => {
        if (v) props.onValueChange(v);
      }}
      aria-label={props['aria-label']}
      className={cn(
        GLASS_CLASS,
        'flex flex-row',
        ROOT_CLASSES_BY_SEGMENTED_CONTROL_SIZE[size],
        props.className,
      )}
    >
      {props.options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          title={opt.tooltip}
          asChild
        >
          <PvTypography
            as="button"
            variant="subtitle1"
            color="textTertiary"
            className={cn(
              'inline-flex items-center justify-center transition-colors cursor-pointer hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=on]:bg-white/10 data-[state=on]:text-text-primary disabled:cursor-not-allowed disabled:opacity-50',
              ITEM_CLASSES_BY_SEGMENTED_CONTROL_SIZE[size],
            )}
          >
            {opt.label}
          </PvTypography>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
};
