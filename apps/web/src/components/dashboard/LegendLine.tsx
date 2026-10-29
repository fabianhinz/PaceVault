import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface LegendLineProps {
  color: string;
  dashed?: boolean;
  label: string;
}

export const LegendLine: FC<LegendLineProps> = (props) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className={cn('w-3.5 border-t-2', props.dashed ? 'border-dashed' : 'border-solid')}
      style={{ borderColor: props.color }}
    />
    {props.label}
  </span>
);
