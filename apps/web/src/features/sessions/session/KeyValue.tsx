import type { FC, ReactNode } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface KeyValueProps {
  label: ReactNode;
  value: string;
  detail: string;
  interactive?: boolean;
}

export const KeyValue: FC<KeyValueProps> = (props) => (
  <div
    className={cn(
      'grid grid-cols-[auto_1fr] items-baseline gap-3 px-1.5 py-0.5',
      !props.interactive && 'pointer-events-none',
    )}
  >
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-text-secondary">
      {props.label}
    </span>
    <span className="text-right text-sm tabular-nums text-text-primary">
      {props.value}
      <span className="block text-xs text-text-tertiary">{props.detail}</span>
    </span>
  </div>
);
